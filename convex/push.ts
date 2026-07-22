"use node";

import webpush from "web-push";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action } from "./_generated/server";

export const sendToUser = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ sent: number; total: number }> => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@pact.app";
    if (!publicKey || !privateKey) {
      throw new Error("VAPID keys are not configured on Convex");
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
        console.warn("[push] send failed", sub.endpoint, error);
      }
    }

    return { sent, total: subscriptions.length };
  },
});
