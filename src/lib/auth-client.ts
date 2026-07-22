import { dashClient, sentinelClient } from "@better-auth/infra/client";
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
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
