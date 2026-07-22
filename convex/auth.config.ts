import type { AuthConfig } from "convex/server";

/**
 * Verifies Better Auth JWTs issued by the Next.js app (Neon-backed sessions).
 *
 * Convex only accepts RS256/ES256 — Better Auth JWT plugin is configured for ES256.
 * Set BETTER_AUTH_ISSUER on the Convex deployment to the public site origin
 * (e.g. https://pact-two-ashy.vercel.app) so JWKS is fetchable from Convex cloud.
 */
const issuer = process.env.BETTER_AUTH_ISSUER;

if (!issuer) {
  console.warn(
    "BETTER_AUTH_ISSUER is not set on this Convex deployment. Auth will fail until it is configured."
  );
}

export default {
  providers: [
    {
      type: "customJwt",
      applicationID: "convex",
      issuer: issuer ?? "https://pact-flowtag-projects.vercel.app",
      jwks: `${issuer ?? "https://pact-flowtag-projects.vercel.app"}/api/auth/jwks`,
      algorithm: "ES256",
    },
  ],
} satisfies AuthConfig;
