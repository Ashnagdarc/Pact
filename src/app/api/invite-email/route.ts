import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";
import { sendEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_RE = /^[a-zA-Z0-9_-]{8,128}$/;

type InviteEmailBody = {
  email?: string;
  token?: string;
  pactTitle?: string;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: InviteEmailBody;
  try {
    body = (await request.json()) as InviteEmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const token = body.token?.trim() ?? "";
  const pactTitle = body.pactTitle?.trim() || "a Pact";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 }
    );
  }
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  if (!process.env.BREVO_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Invite email is temporarily unavailable" },
      { status: 503 }
    );
  }

  const origin =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    new URL(request.url).origin;
  const inviteUrl = `${origin.replace(/\/$/, "")}/invite/${token}`;
  const inviter =
    session.user.name?.trim() || session.user.email || "Someone on Pact";

  const task = sendEmail({
    to: email,
    subject: `${inviter} invited you to Pact`,
    text: `${inviter} invited you to join “${pactTitle}” on Pact.\n\nOpen this link to accept:\n${inviteUrl}\n\nIf you weren’t expecting this, you can ignore the email.`,
    html: `<p><strong>${inviter}</strong> invited you to join “${pactTitle}” on Pact.</p><p><a href="${inviteUrl}">Accept invite</a></p><p style="color:#707070;font-size:13px">If you weren’t expecting this, you can ignore the email.</p>`,
  });
  waitUntil(task);

  try {
    await task;
  } catch (error) {
    console.error("[invite-email] send failed", error);
    return NextResponse.json(
      { error: "Could not send invite email. Try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
