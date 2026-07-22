import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

/**
 * Use same-origin in the browser so local `localhost:3000` talks to local
 * `/api/auth/*` (not the production Vercel host). Convex JWTs come from
 * `/api/convex-token` and must match `convex/auth.config.ts` iss/aud/JWKS.
 */
export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [
    dashClient(),
    sentinelClient({
      autoSolveChallenge: true,
      // NEXT_PUBLIC_ required for browser; BETTER_AUTH_* alone is server-only in Next.
      identifyUrl:
        process.env.NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL ??
        process.env.BETTER_AUTH_IDENTIFY_URL,
    }),
    jwtClient(),
  ],
});
