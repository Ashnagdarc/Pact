import { NextResponse } from "next/server";

import {
  buildBetaAccessUrl,
  siteOriginFromRequest,
} from "@/lib/beta-access";
import { mintWaitlistInvite } from "@/lib/convex-http";
import { sendEmail } from "@/lib/email";
import { escapeHtml, wrapEmailHtml } from "@/lib/email-html";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Best-effort per-instance rate limit (serverless instances don't share memory). */
const WAITLIST_RATE_WINDOW_MS = 60_000;
const WAITLIST_RATE_MAX = 8;
const waitlistHits = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request): string {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function rateLimitWaitlist(ip: string): boolean {
  const now = Date.now();
  const row = waitlistHits.get(ip);
  if (!row || row.resetAt <= now) {
    waitlistHits.set(ip, { count: 1, resetAt: now + WAITLIST_RATE_WINDOW_MS });
    return true;
  }
  if (row.count >= WAITLIST_RATE_MAX) {
    return false;
  }
  row.count += 1;
  return true;
}

type WaitlistBody = {
  email?: string;
  name?: string;
};

async function addToBrevoList(input: {
  email: string;
  name?: string;
  code: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_BETA_WAITLIST_LIST_ID);
  if (!apiKey || !Number.isFinite(listId) || listId <= 0) {
    throw new Error("Brevo waitlist is not configured");
  }

  const attributes: Record<string, string | boolean> = {
    SOURCE: "beta_waitlist",
    BETA_WAITLIST: true,
  };
  if (input.name) {
    attributes.FIRSTNAME = input.name;
  }

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      attributes,
      listIds: [listId],
      updateEnabled: true,
    }),
  });

  if (!response.ok && response.status !== 204) {
    const payload = await response.text();
    if (
      response.status === 400 &&
      payload.includes("Contact already exist")
    ) {
      // C9: create early-returns left existing contacts off the waitlist list.
      const update = await fetch(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(input.email)}`,
        {
          method: "PUT",
          headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            attributes,
            listIds: [listId],
          }),
        },
      );
      if (!update.ok && update.status !== 204) {
        const updatePayload = await update.text();
        throw new Error(
          `Brevo contact update failed (${update.status}): ${updatePayload}`,
        );
      }
      return;
    }
    throw new Error(`Brevo contacts failed (${response.status}): ${payload}`);
  }
}

function welcomeEmail(input: {
  name?: string;
  email: string;
  code: string;
  accessUrl: string;
  unsubscribeUrl: string;
}) {
  const greeting = input.name ? `Hi ${input.name}` : "Hi there";
  const subject = "Your Pact early beta access";
  const text = `${greeting},

Thanks for joining the Pact private beta waitlist.

Your one-time early access code is: ${input.code}

Open your personal access link (works once):
${input.accessUrl}

Use the link or enter the 6-digit code on the sign-up page to create your account and open /app.

Each code is unique and can only be used once.

Unsubscribe: ${input.unsubscribeUrl}

— Pact
https://www.joinpact.tech`;

  const html = wrapEmailHtml(
    `<p style="margin:0 0 12px;font-size:22px;font-weight:800;color:#fff">${escapeHtml(greeting)},</p>
     <p style="margin:0 0 16px;color:#ccc">Thanks for joining the <strong style="color:#fff">Pact</strong> private beta waitlist.</p>
     <p style="margin:0 0 8px;color:#ccc">Your one-time early access code:</p>
     <p style="font-size:32px;font-weight:800;letter-spacing:0.2em;margin:0 0 20px;color:#c9ff4a">${escapeHtml(input.code)}</p>
     <p style="margin:0 0 16px">
       <a href="${escapeHtml(input.accessUrl)}" style="display:inline-block;background:#c9ff4a;color:#050505;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px">
         Open your access link
       </a>
     </p>
     <p style="margin:0;color:#888;font-size:14px">
       This link and code are unique to you and can only be used <strong>once</strong>.
     </p>`,
    {
      title: subject,
      preheader: "Your early beta access code is ready",
      unsubscribeUrl: input.unsubscribeUrl,
    },
  );

  return { subject, text, html };
}

export async function POST(request: Request) {
  if (!rateLimitWaitlist(clientIp(request))) {
    return NextResponse.json(
      { error: "Too many waitlist requests. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: WaitlistBody;
  try {
    body = (await request.json()) as WaitlistBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const name = body.name?.trim() || undefined;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }

  try {
    const invite = await mintWaitlistInvite({
      email,
      name,
      source: "landing",
    });

    if (!invite.code || !invite.token) {
      throw new Error("Invite code was not issued");
    }

    const origin = siteOriginFromRequest(request);
    const accessUrl = buildBetaAccessUrl(origin, invite.token);
    const unsubscribeUrl = buildUnsubscribeUrl({
      kind: "waitlist",
      id: String(invite.id),
      origin,
    });

    const mail = welcomeEmail({
      name: invite.name || name,
      email,
      code: invite.code,
      accessUrl,
      unsubscribeUrl,
    });

    // Email first — this is what unlocks early access.
    await sendEmail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      unsubscribeUrl,
    });

    // Brevo list sync is best-effort. Vercel egress IPs change often and will
    // 401 if Brevo "authorised IPs" is enabled.
    try {
      await addToBrevoList({
        email,
        name: invite.name || name,
        code: invite.code,
      });
    } catch (brevoError) {
      console.warn("[waitlist] Brevo list sync skipped", brevoError);
    }

    return NextResponse.json({
      ok: true,
      alreadyJoined: invite.alreadyJoined,
      email,
      name: invite.name || name || null,
    });
  } catch (error) {
    console.error("[waitlist] join failed", error);
    return NextResponse.json(
      { error: "Could not join the waitlist. Try again." },
      { status: 502 },
    );
  }
}
