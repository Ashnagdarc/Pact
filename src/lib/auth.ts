import { dash, sentinel } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

/**
 * Better Auth (Next.js) + Infrastructure dashboard via `dash()` + `sentinel()`.
 * Uses Postgres (Neon) so auth works on Vercel serverless.
 * @see https://better-auth.com/docs/infrastructure/getting-started
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

export const auth = betterAuth({
  appName: "Pact",
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
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
    nextCookies(),
  ],
});
