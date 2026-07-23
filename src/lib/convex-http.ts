import { ConvexHttpClient } from "convex/browser";

import { api } from "@convex/_generated/api";
import { getPactServerSecret } from "@/lib/server-secret";

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
  return convex.mutation(api.waitlist.join, {
    ...input,
    secret: getPactServerSecret(),
  });
}

export async function validateBetaInvite(input: {
  token?: string;
  code?: string;
  /** When provided (signup), the invite must belong to this email. */
  email?: string;
}) {
  const convex = getConvexHttpClient();
  return convex.query(api.waitlist.validateInvite, input);
}

/** Atomically claim a personal invite after user create (B2). */
export async function claimBetaInvite(input: {
  token?: string;
  code?: string;
  email: string;
  usedByUserId?: string;
}) {
  const convex = getConvexHttpClient();
  return convex.mutation(api.waitlist.claimInvite, {
    ...input,
    secret: getPactServerSecret(),
  });
}

/** B6: cascade Convex data from Better Auth beforeDelete. */
export async function deleteConvexAccountByAuthUserId(authUserId: string) {
  const convex = getConvexHttpClient();
  return convex.mutation(api.users.deleteAccountDataByAuthUserId, {
    secret: getPactServerSecret(),
    authUserId,
  });
}

/** B7: verify invite ownership + load DB title for invite emails. */
export async function getInviteForEmail(token: string) {
  const convex = getConvexHttpClient();
  return convex.query(api.invitations.getForInviteEmail, {
    secret: getPactServerSecret(),
    token,
  });
}
