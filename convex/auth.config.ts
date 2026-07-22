import type { AuthConfig } from "convex/server";

/**
 * Verifies Pact-issued JWTs from `/api/convex-token` (Better Auth session → ES256).
 *
 * Convex matches providers on exact `iss` + `aud` (applicationID).
 * We register local + production issuers and both `aud=convex` and site-URL
 * audiences so local/prod env drift does not break auth.
 */
const productionIssuer =
  process.env.BETTER_AUTH_ISSUER ?? "https://pact-flowtag-projects.vercel.app";
const localIssuer = "http://localhost:3000";

/**
 * Public ES256 JWKS for Pact-issued Convex JWTs (kid pact-convex-es256).
 * Private key lives in Next.js as PACT_CONVEX_JWT_PRIVATE_JWK — not Neon JWKS.
 */
const FALLBACK_JWKS_DATA_URI =
  "data:text/plain;charset=utf-8;base64,eyJrZXlzIjpbeyJrdHkiOiJFQyIsIngiOiJMaVFtZnBmN0gyWWhqbng0elphNWd6djdwaUVRbTZmLXR2R0dWM1NpWVJFIiwieSI6IldoR1JueGRBZDVvejZVMXZiVkE5QTFhTGJBLXVqelZKVkhtTVJIcjZUbWsiLCJjcnYiOiJQLTI1NiIsImtpZCI6InBhY3QtY29udmV4LWVzMjU2IiwidXNlIjoic2lnIiwiYWxnIjoiRVMyNTYifV19";

const jwks = process.env.BETTER_AUTH_JWKS ?? FALLBACK_JWKS_DATA_URI;

function customJwt(issuer: string, audience: string) {
  return {
    type: "customJwt" as const,
    applicationID: audience,
    issuer,
    jwks,
    algorithm: "ES256" as const,
  };
}

export default {
  providers: [
    // Preferred: aud=convex (set explicitly by Better Auth jwt plugin).
    customJwt(productionIssuer, "convex"),
    customJwt(localIssuer, "convex"),
    // Fallback if jwt.audience was omitted and Better Auth defaulted aud to baseURL.
    customJwt(productionIssuer, productionIssuer),
    customJwt(localIssuer, localIssuer),
  ],
} satisfies AuthConfig;
