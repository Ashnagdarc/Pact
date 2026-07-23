import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth-server";
import { getInviteForEmail } from "@/lib/convex-http";
import { sendEmail } from "@/lib/email";
import { escapeHtml, wrapEmailHtml } from "@/lib/email-html";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_RE = /^[a-zA-Z0-9_-]{8,128}$/;

const INVITE_RATE_WINDOW_MS = 60_000;
const INVITE_RATE_MAX = 5;
const inviteHits = new Map<string, { count: number; resetAt: number }>();

type InviteEmailBody = {
  email?: string;
  token?: string;
};

function rateLimitInvite(userId: string): boolean {
  const now = Date.now();
  const row = inviteHits.get(userId);
  if (!row || row.resetAt <= now) {
    inviteHits.set(userId, { count: 1, resetAt: now + INVITE_RATE_WINDOW_MS });
    return true;
  }
  if (row.count >= INVITE_RATE_MAX) {
    return false;
  }
  row.count += 1;
  return true;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!rateLimitInvite(session.user.id)) {
    return NextResponse.json(
      { error: "Too many invite emails. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: InviteEmailBody;
  try {
    body = (await request.json()) as InviteEmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const token = body.token?.trim() ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address" },
      { status: 400 },
    );
  }
  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  if (!process.env.BREVO_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "Invite email is temporarily unavailable" },
      { status: 503 },
    );
  }

  let invite;
  try {
    invite = await getInviteForEmail(token);
  } catch (error) {
    console.error("[invite-email] invite lookup failed", error);
    return NextResponse.json(
      { error: "Could not verify invite. Try again." },
      { status: 502 },
    );
  }

  if (!invite || invite.createdByAuthUserId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only email invites you created" },
      { status: 403 },
    );
  }

  const origin =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    new URL(request.url).origin;
  const inviteUrl = `${origin.replace(/\/$/, "")}/invite/${token}`;
  const inviter =
    invite.inviterName?.trim() ||
    session.user.name?.trim() ||
    session.user.email ||
    "Someone on Pact";
  const pactTitle = invite.pactTitle || "a Pact";

  const task = sendEmail({
    to: email,
    subject: `${inviter} invited you to Pact`,
    text: `${inviter} invited you to join “${pactTitle}” on Pact.\n\nOpen this link to accept:\n${inviteUrl}\n\nIf you weren’t expecting this, you can ignore the email.`,
    html: wrapEmailHtml(
      `<p style="margin:0 0 16px;color:#ddd"><strong style="color:#fff">${escapeHtml(inviter)}</strong> invited you to join “${escapeHtml(pactTitle)}” on Pact.</p>
       <p style="margin:0 0 16px"><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#c9ff4a;color:#050505;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:999px">Accept invite</a></p>
       <p style="margin:0;color:#888;font-size:13px">If you weren’t expecting this, you can ignore the email.</p>`,
      { title: "Pact invite" },
    ),
  });
  waitUntil(task);

  try {
    await task;
  } catch (error) {
    console.error("[invite-email] send failed", error);
    return NextResponse.json(
      { error: "Could not send invite email. Try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
