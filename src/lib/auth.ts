import { dash, sentinel } from "@better-auth/infra";
import { betterAuth, APIError } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { attachDatabasePool } from "@vercel/functions";
import { cookies } from "next/headers";
import { Pool } from "pg";

import { BETA_ACCESS_COOKIE, betaAccessOpen } from "@/lib/beta-access";
import {
  claimBetaInvite,
  deleteConvexAccountByAuthUserId,
  validateBetaInvite,
} from "@/lib/convex-http";
import { captureResetLink, queueEmail } from "@/lib/email";
import { escapeHtml, wrapEmailHtml } from "@/lib/email-html";

/**
 * Better Auth (Next.js) + Infrastructure dashboard via `dash()` + `sentinel()`.
 * Uses Postgres (Neon) so auth works on Vercel serverless.
 * JWT plugin issues ES256 tokens for Convex (`ctx.auth.getUserIdentity()`).
 * @see https://better-auth.com/docs/infrastructure/getting-started
 * @see https://better-auth.com/docs/plugins/jwt
 * @see https://neon.com/docs/connect/connection-pooling (pooled URL + small pool)
 */
function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Use a Postgres connection string (e.g. Neon).",
    );
  }

  const isLocal =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

  // B9: max 1 connection per serverless instance; verify TLS for Neon.
  // Prefer DATABASE_URL with Neon's -pooler hostname on Vercel.
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    ssl: isLocal ? undefined : { rejectUnauthorized: true },
  });
  attachDatabasePool(pool);
  return pool;
}

const infraApiKey = process.env.BETTER_AUTH_API_KEY;

/** Public origin used as JWT `iss` - must match a Convex customJwt issuer. */
function normalizeIssuer(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    // Keep localhost as-is; force production apex → www canonical.
    if (url.hostname === "joinpact.tech") {
      url.hostname = "www.joinpact.tech";
    }
    return url.origin;
  } catch {
    return raw.replace(/\/$/, "") || undefined;
  }
}

export const authJwtIssuer =
  normalizeIssuer(process.env.BETTER_AUTH_JWT_ISSUER) ??
  normalizeIssuer(process.env.BETTER_AUTH_URL) ??
  normalizeIssuer(process.env.NEXT_PUBLIC_SITE_URL) ??
  "https://www.joinpact.tech";

/** Convex customJwt `applicationID` - must match JWT `aud`. */
export const authJwtAudience = "convex";

function infraConnectionOptions() {
  return {
    ...(process.env.BETTER_AUTH_API_URL
      ? { apiUrl: process.env.BETTER_AUTH_API_URL }
      : {}),
    ...(process.env.BETTER_AUTH_KV_URL
      ? { kvUrl: process.env.BETTER_AUTH_KV_URL }
      : {}),
  };
}

const productionHost = "www.joinpact.tech";
const productionOrigin = `https://${productionHost}`;
const apexHost = "joinpact.tech";
const apexOrigin = `https://${apexHost}`;

export const auth = betterAuth({
  appName: "Pact",
  // Allow canonical + Vercel preview/deployment hosts (fixes "Invalid origin").
  baseURL: {
    allowedHosts: [
      productionHost,
      apexHost,
      "pact-flowtag-projects.vercel.app",
      "pact-two-ashy.vercel.app",
      "localhost:3000",
      "127.0.0.1:3000",
      "*.vercel.app",
    ],
    protocol: "auto",
    fallback:
      process.env.BETTER_AUTH_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      productionOrigin,
  },
  trustedOrigins: [
    productionOrigin,
    apexOrigin,
    "https://pact-flowtag-projects.vercel.app",
    "https://pact-two-ashy.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.vercel.app",
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  database: createDatabase(),
  databaseHooks: {
    user: {
      create: {
        // Validate only - the atomic claim happens in `after` once the user
        // row exists, so a failed signup can never burn the invite.
        before: async (user) => {
          if (betaAccessOpen()) return;
          const jar = await cookies();
          const token = jar.get(BETA_ACCESS_COOKIE)?.value;
          if (!token) {
            throw new APIError("FORBIDDEN", {
              message:
                "Early beta requires a one-time invite code. Request private beta access first.",
            });
          }
          const invite = await validateBetaInvite({ token, email: user.email });
          if (!invite.valid) {
            switch (invite.reason) {
              case "used":
                throw new APIError("FORBIDDEN", {
                  message: "This invite code was already used.",
                });
              case "email_mismatch":
                throw new APIError("FORBIDDEN", {
                  message: "This invite belongs to a different email address.",
                });
              case "not_found":
                throw new APIError("FORBIDDEN", {
                  message:
                    "Invalid beta invite. Request a new access code on the home page.",
                });
              default: {
                const exhaustive: never = invite;
                void exhaustive;
                throw new APIError("FORBIDDEN", {
                  message:
                    "Invalid beta invite. Request a new access code on the home page.",
                });
              }
            }
          }
        },
        // Claim atomically now that the user exists (sets usedAt iff unset).
        after: async (user) => {
          if (betaAccessOpen()) return;
          const jar = await cookies();
          const token = jar.get(BETA_ACCESS_COOKIE)?.value;
          if (!token) {
            console.error(
              "[pact-auth] beta cookie missing in user.create.after; invite not claimed for",
              user.email,
            );
            return;
          }
          const claim = await claimBetaInvite({
            token,
            email: user.email,
            usedByUserId: user.id,
          });
          if (!claim.claimed) {
            // Loud: "used" here means another signup consumed the invite
            // between validate (before) and claim (after) - race indicator.
            console.error(
              "[pact-auth] beta invite claim failed after user create",
              { reason: claim.reason, email: user.email, userId: user.id },
            );
          }
        },
      },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      // B6: wipe Convex app data before Neon auth row is removed so we never
      // leave an Auth user without a matching Convex wipe attempt.
      beforeDelete: async (user) => {
        try {
          await deleteConvexAccountByAuthUserId(user.id);
        } catch (error) {
          console.error("[pact-auth] Convex cascade failed before delete", error);
          throw new APIError("INTERNAL_SERVER_ERROR", {
            message:
              "Could not remove your Pact data. Try again or contact support.",
          });
        }
      },
      sendDeleteAccountVerification: async ({ user, url }) => {
        const safeUrl = escapeHtml(url);
        queueEmail({
          to: user.email,
          subject: "Confirm deleting your Pact account",
          text: `Confirm account deletion:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
          html: wrapEmailHtml(
            `<p style="margin:0 0 16px;color:#ddd">Confirm deleting your Pact account:</p><p style="margin:0"><a href="${safeUrl}" style="color:#c9ff4a">${safeUrl}</a></p><p style="margin:16px 0 0;color:#888;font-size:13px">If you did not request this, you can ignore this email.</p>`,
            { title: "Confirm account deletion" },
          ),
        });
      },
    },
  },
  advanced: {
    ipAddress: {
      // Vercel sets x-vercel-forwarded-for; prefer it over client-spoofable XFF.
      ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"],
    },
  },
  rateLimit: {
    // In-memory counters don't share across Vercel serverless instances.
    storage: "database",
  },
  experimental: {
    joins: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url, token }) => {
      captureResetLink({ email: user.email, url, token });
      const safeUrl = escapeHtml(url);
      queueEmail({
        to: user.email,
        subject: "Reset your Pact password",
        text: `Reset your Pact password:\n\n${url}\n\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.`,
        html: wrapEmailHtml(
          `<p style="margin:0 0 16px;color:#ddd">Reset your Pact password:</p><p style="margin:0"><a href="${safeUrl}" style="color:#c9ff4a">${safeUrl}</a></p><p style="margin:16px 0 0;color:#888;font-size:13px">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>`,
          { title: "Reset password" },
        ),
      });
    },
    onPasswordReset: async ({ user }) => {
      console.info("[pact-auth] password reset completed for", user.email);
    },
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  plugins: [
    ...(infraApiKey
      ? [
          // Only pass apiUrl/kvUrl when set - undefined would overwrite
          // @better-auth/infra defaults and break /dash/validate (JWKS fetch).
          dash({
            apiKey: infraApiKey,
            ...infraConnectionOptions(),
          }),
          sentinel({
            apiKey: infraApiKey,
            ...infraConnectionOptions(),
            security: {
              // Gmail dots/aliases become one identity (avoids duplicate accounts).
              emailNormalization: { enabled: true },
              // Dev/beta: challenge instead of hard-block after failed logins.
              credentialStuffing: {
                enabled: true,
                thresholds: { challenge: 8, block: 20 },
                windowSeconds: 3600,
                cooldownSeconds: 300,
              },
              velocity: {
                enabled: true,
                thresholds: { challenge: 30, block: 60 },
                maxSignInsPerIp: 80,
                windowSeconds: 3600,
                action: "challenge",
              },
            },
          }),
        ]
      : []),
    // Convex customJwt supports ES256/RS256 only (not EdDSA default).
    // Private-key encryption is disabled: Neon JWKS rows were encrypted under
    // mismatched secrets and broke /token. Convex tokens are minted separately
    // by `/api/convex-token` using PACT_CONVEX_JWT_PRIVATE_JWK.
    jwt({
      jwks: {
        disablePrivateKeyEncryption: true,
        keyPairConfig: {
          alg: "ES256",
        },
      },
      jwt: {
        issuer: authJwtIssuer,
        audience: authJwtAudience,
        expirationTime: "1h",
        // Better Auth passes `{ user, session }` here (see jwt plugin getJwtToken).
        definePayload: ({ user }) => ({
          name: user.name,
          email: user.email,
          email_verified: Boolean(user.emailVerified),
          picture: user.image,
          iss: authJwtIssuer,
          aud: authJwtAudience,
        }),
      },
    }),
    nextCookies(),
  ],
});
