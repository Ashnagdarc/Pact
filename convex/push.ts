"use node";

import webpush from "web-push";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalAction, type ActionCtx } from "./_generated/server";

async function deliver(
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    title: string;
    body: string;
    href?: string;
  }
): Promise<{ sent: number; total: number }> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@pact.app";
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys are not configured on Convex");
    return { sent: 0, total: 0 };
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const subscriptions: Doc<"pushSubscriptions">[] = await ctx.runQuery(
    internal.pushSubscriptions.listForUser,
    { userId: args.userId }
  );

  const payload = JSON.stringify({
    title: args.title,
    body: args.body,
    href: args.href ?? "/",
  });

  let sent = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          expirationTime: sub.expirationTime ?? null,
          keys: sub.keys,
        },
        payload
      );
      sent += 1;
    } catch (error) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : undefined;
      console.warn("[push] send failed", sub.endpoint, error);
      if (statusCode === 404 || statusCode === 410) {
        await ctx.runMutation(internal.pushSubscriptions.removeByEndpoint, {
          endpoint: sub.endpoint,
        });
      }
    }
  }

  return { sent, total: subscriptions.length };
}

/** Internal-only push delivery. Call via scheduler / other internal functions. */
export const deliverToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
  },
  handler: async (ctx, args) => deliver(ctx, args),
});
