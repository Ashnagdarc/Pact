import { NextResponse } from "next/server";

import {
  buildBetaAccessUrl,
  siteOriginFromRequest,
} from "@/lib/beta-access";
import { mintWaitlistInvite } from "@/lib/convex-http";
import { sendEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

— Pact
https://www.joinpact.tech`;

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;color:#111;max-width:560px">
      <p style="font-size:28px;font-weight:800;margin:0 0 12px;color:#111">${greeting},</p>
      <p style="margin:0 0 16px;color:#444">Thanks for joining the <strong>Pact</strong> private beta waitlist.</p>
      <p style="margin:0 0 8px;color:#444">Your one-time early access code:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:0.2em;margin:0 0 20px">${input.code}</p>
      <p style="margin:0 0 16px">
        <a href="${input.accessUrl}" style="display:inline-block;background:#c9ff4a;color:#050505;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px">
          Open your access link
        </a>
      </p>
      <p style="margin:0 0 12px;color:#666;font-size:14px">
        This link and code are unique to you and can only be used <strong>once</strong> to create your account and enter the early public beta.
      </p>
      <p style="margin:24px 0 0;color:#999;font-size:12px">— Pact · joinpact.tech</p>
    </div>
  `;

  return { subject, text, html };
}

export async function POST(request: Request) {
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

    const mail = welcomeEmail({
      name: invite.name || name,
      email,
      code: invite.code,
      accessUrl,
    });

    // Email first — this is what unlocks early access.
    await sendEmail({
      to: email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
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
      code: invite.code,
      accessUrl,
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
