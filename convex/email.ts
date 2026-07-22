import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, type ActionCtx } from "./_generated/server";

function siteOrigin() {
  return (
    process.env.SITE_URL ??
    process.env.BETTER_AUTH_ISSUER ??
    "https://www.joinpact.tech"
  ).replace(/\/$/, "");
}

function emailFrom() {
  return process.env.EMAIL_FROM ?? "Pact <noreply@joinpact.tech>";
}

function parseFromAddress(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim() || "Pact", email: match[2].trim() };
  }
  return { name: "Pact", email: from.trim() };
}

async function deliver(
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    title: string;
    body: string;
    href?: string;
  }
): Promise<{ sent: boolean }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[email] BREVO_API_KEY is not configured on Convex");
    return { sent: false };
  }

  const recipient = await ctx.runQuery(internal.users.getEmailForNotify, {
    userId: args.userId,
  });
  if (!recipient?.email) {
    console.warn("[email] no email for user", args.userId);
    return { sent: false };
  }

  const origin = siteOrigin();
  const path = args.href?.startsWith("/") ? args.href : `/${args.href ?? "app"}`;
  const link = `${origin}${path}`;
  const from = parseFromAddress(emailFrom());

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: from,
      to: [{ email: recipient.email, name: recipient.displayName }],
      subject: args.title,
      textContent: `${args.body}\n\nOpen in Pact:\n${link}`,
      htmlContent: `<p>${args.body}</p><p><a href="${link}">Open in Pact</a></p>`,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    console.error("[email] Brevo failed", response.status, payload);
    return { sent: false };
  }

  return { sent: true };
}

/** Internal-only email delivery for product notifications. */
export const deliverToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    href: v.optional(v.string()),
  },
  handler: async (ctx, args) => deliver(ctx, args),
});
