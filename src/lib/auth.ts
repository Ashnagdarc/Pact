import { dash, sentinel } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

import { captureResetLink, sendEmail } from "@/lib/email";

/**
 * Better Auth (Next.js) + Infrastructure dashboard via `dash()` + `sentinel()`.
 * Uses Postgres (Neon) so auth works on Vercel serverless.
 * JWT plugin issues ES256 tokens for Convex (`ctx.auth.getUserIdentity()`).
 * @see https://better-auth.com/docs/infrastructure/getting-started
 * @see https://better-auth.com/docs/plugins/jwt
 */
function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Use a Postgres connection string (e.g. Neon).",
    );
  }

  return new Pool({
    connectionString: databaseUrl,
    ssl:
      databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
        ? undefined
        : { rejectUnauthorized: false },
  });
}

const infraApiKey = process.env.BETTER_AUTH_API_KEY;

/** Public origin used as JWT `iss` — must match Convex `BETTER_AUTH_ISSUER`. */
export const authJwtIssuer =
  process.env.BETTER_AUTH_JWT_ISSUER ??
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://pact-flowtag-projects.vercel.app";

/** Convex customJwt `applicationID` — must match JWT `aud`. */
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

const productionHost = "pact-flowtag-projects.vercel.app";
const productionOrigin = `https://${productionHost}`;

export const auth = betterAuth({
  appName: "Pact",
  // Allow canonical + Vercel preview/deployment hosts (fixes "Invalid origin").
  baseURL: {
    allowedHosts: [
      productionHost,
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
    "https://pact-two-ashy.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.vercel.app",
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  database: createDatabase(),
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
      void sendEmail({
        to: user.email,
        subject: "Reset your Pact password",
        text: `Reset your Pact password:\n\n${url}\n\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.`,
        html: `<p>Reset your Pact password:</p><p><a href="${url}">${url}</a></p><p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>`,
      }).catch((error) => {
        console.error("[pact-email] reset email failed", error);
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
          // Only pass apiUrl/kvUrl when set — undefined would overwrite
          // @better-auth/infra defaults and break /dash/validate (JWKS fetch).
          dash({
            apiKey: infraApiKey,
            ...infraConnectionOptions(),
          }),
          sentinel({
            apiKey: infraApiKey,
            ...infraConnectionOptions(),
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
          picture: user.image,
          iss: authJwtIssuer,
          aud: authJwtAudience,
        }),
      },
    }),
    nextCookies(),
  ],
});
