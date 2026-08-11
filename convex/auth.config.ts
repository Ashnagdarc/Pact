import type { AuthConfig } from "convex/server";

/**
 * Verifies Pact-issued JWTs from `/api/convex-token` (Better Auth session → ES256).
 *
 * Convex matches providers on exact `iss` + `aud` (applicationID).
 * Register every issuer the Next app might mint (`www`, apex, Vercel, local)
 * so env drift does not produce "No auth provider found matching the given token".
 */
const configuredIssuer = process.env.BETTER_AUTH_ISSUER;
const wwwIssuer = "https://www.joinpact.tech";
const apexIssuer = "https://joinpact.tech";
const localIssuer = "http://localhost:3000";
const localIssuerIp = "http://127.0.0.1:3000";

/**
 * Public ES256 JWKS for Pact-issued Convex JWTs (kid pact-convex-es256).
 * Private key lives in Next.js as PACT_CONVEX_JWT_PRIVATE_JWK - not Neon JWKS.
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

const issuers = Array.from(
  new Set(
    [configuredIssuer, wwwIssuer, apexIssuer, localIssuer, localIssuerIp].filter(
      (value): value is string => Boolean(value)
    )
  )
);

export default {
  providers: issuers.flatMap((issuer) => [
    // Preferred: aud=convex (minted by /api/convex-token).
    customJwt(issuer, "convex"),
    // Fallback if aud defaulted to the site origin.
    customJwt(issuer, issuer),
  ]),
} satisfies AuthConfig;
