import type { AuthConfig } from "convex/server";

/**
 * Verifies Better Auth JWTs issued by the Next.js app (Neon-backed sessions).
 *
 * Convex matches providers on exact `iss` + `aud` (applicationID).
 * We register local + production issuers and both `aud=convex` and site-URL
 * audiences so local/prod env drift does not break auth.
 */
const productionIssuer =
  process.env.BETTER_AUTH_ISSUER ?? "https://pact-flowtag-projects.vercel.app";
const localIssuer = "http://localhost:3000";

/** Public ES256 JWKS currently stored in Neon (kid F0Rh4wGk3DEPmahc3Nen29rt2EGOGwTf). */
const FALLBACK_JWKS_DATA_URI =
  "data:text/plain;charset=utf-8;base64,eyJrZXlzIjpbeyJhbGciOiJFUzI1NiIsImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ4IjoiM2M3aGJNdW9GWDBBblR5MDhMT0VNTGdTNWM4V0w0ZG5XdVRvR183aVo3YyIsInkiOiJNTlFWQkhCdVVIMkhISUFuRnNkSElOZGhUVnNRUm40Q1dvWXdaTW0ydDFZIiwia2lkIjoiRjBSaDR3R2szREVQbWFoYzNOZW4yOXJ0MkVHT0d3VGYifV19";

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
