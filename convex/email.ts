import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, type ActionCtx } from "./_generated/server";
import {
  buildUserUnsubscribeUrl,
  escapeHtml,
  wrapEmailHtml,
} from "./lib/emailHtml";

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

function isProductionDeploy() {
  const site = process.env.SITE_URL ?? "";
  return (
    process.env.BREVO_REQUIRED === "1" ||
    site.includes("joinpact.tech") ||
    process.env.CONVEX_ENVIRONMENT === "production"
  );
}

async function deliver(
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    title: string;
    body: string;
    href?: string;
  },
): Promise<{ sent: boolean }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    const message = "[email] BREVO_API_KEY is not configured on Convex";
    console.error(message);
    if (isProductionDeploy()) {
      throw new Error(message);
    }
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
  const unsubscribeUrl = await buildUserUnsubscribeUrl(args.userId);

  const safeTitle = escapeHtml(args.title);
  const safeBody = escapeHtml(args.body);
  const html = wrapEmailHtml(
    `<p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#fff">${safeTitle}</p>
     <p style="margin:0 0 16px;color:#ccc">${safeBody}</p>
     <p style="margin:0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#c9ff4a;color:#050505;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px">Open in Pact</a></p>`,
    { title: args.title, unsubscribeUrl },
  );

  const headers: Record<string, string> = {};
  if (unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

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
      textContent: `${args.body}\n\nOpen in Pact:\n${link}${
        unsubscribeUrl ? `\n\nUnsubscribe: ${unsubscribeUrl}` : ""
      }`,
      htmlContent: html,
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
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
