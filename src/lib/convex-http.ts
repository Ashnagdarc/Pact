import { ConvexHttpClient } from "convex/browser";

import { api } from "@convex/_generated/api";

export function getConvexHttpClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

export async function mintWaitlistInvite(input: {
  email: string;
  name?: string;
  source?: string;
}) {
  const convex = getConvexHttpClient();
  return convex.mutation(api.waitlist.join, input);
}

export async function validateBetaInvite(input: {
  token?: string;
  code?: string;
}) {
  const convex = getConvexHttpClient();
  return convex.query(api.waitlist.validateInvite, input);
}

export async function consumeBetaInvite(input: {
  token?: string;
  code?: string;
}) {
  const convex = getConvexHttpClient();
  return convex.mutation(api.waitlist.consumeInvite, input);
}
