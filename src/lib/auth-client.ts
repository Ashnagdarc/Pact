import { dashClient, sentinelClient } from "@better-auth/infra/client";
import type { BetterAuthClientPlugin } from "better-auth";
import { createAuthClient } from "better-auth/react";

// @better-auth/infra types track better-auth 1.7; cast until types align.
const infraPlugins = [
  dashClient(),
  sentinelClient({
    autoSolveChallenge: true,
    // NEXT_PUBLIC_ required for browser; BETTER_AUTH_* alone is server-only in Next.
    identifyUrl:
      process.env.NEXT_PUBLIC_BETTER_AUTH_IDENTIFY_URL ??
      process.env.BETTER_AUTH_IDENTIFY_URL,
  }),
] as unknown as BetterAuthClientPlugin[];

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: infraPlugins,
});
