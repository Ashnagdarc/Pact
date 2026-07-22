import type { AuthConfig } from "convex/server";

/**
 * Verifies Better Auth JWTs issued by the Next.js app (Neon-backed sessions).
 *
 * Convex only accepts RS256/ES256 — Better Auth JWT plugin is configured for ES256.
 *
 * Prefer a static JWKS data URI (BETTER_AUTH_JWKS) so Convex does not need to
 * fetch `/api/auth/jwks` over the public internet. That fetch fails when Vercel
 * Deployment Protection / SSO is enabled on the site.
 */
const issuer = process.env.BETTER_AUTH_ISSUER ?? "https://pact-flowtag-projects.vercel.app";

/** Public ES256 JWKS currently stored in Neon (kid F0Rh4wGk3DEPmahc3Nen29rt2EGOGwTf). */
const FALLBACK_JWKS_DATA_URI =
  "data:text/plain;charset=utf-8;base64,eyJrZXlzIjpbeyJhbGciOiJFUzI1NiIsImNydiI6IlAtMjU2Iiwia3R5IjoiRUMiLCJ4IjoiM2M3aGJNdW9GWDBBblR5MDhMT0VNTGdTNWM4V0w0ZG5XdVRvR183aVo3YyIsInkiOiJNTlFWQkhCdVVIMkhISUFuRnNkSElOZGhUVnNRUm40Q1dvWXdaTW0ydDFZIiwia2lkIjoiRjBSaDR3R2szREVQbWFoYzNOZW4yOXJ0MkVHT0d3VGYifV19";

const jwks = process.env.BETTER_AUTH_JWKS ?? FALLBACK_JWKS_DATA_URI;

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "convex",
      issuer,
      jwks,
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;
