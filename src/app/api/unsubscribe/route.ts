import { NextResponse } from "next/server";

import { api } from "@convex/_generated/api";
import { getConvexHttpClient } from "@/lib/convex-http";
import { getPactServerSecret } from "@/lib/server-secret";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

async function optOut(token: string) {
  const parsed = verifyUnsubscribeToken(token);
  if (!parsed) {
    return { ok: false as const, error: "Invalid or expired unsubscribe link" };
  }

  const convex = getConvexHttpClient();
  await convex.mutation(api.users.setEmailNotificationsBySecret, {
    secret: getPactServerSecret(),
    kind: parsed.kind,
    id: parsed.id,
    emailNotifications: false,
  });

  return { ok: true as const, kind: parsed.kind };
}

/** One-click List-Unsubscribe (RFC 8058) + browser GET. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let token = url.searchParams.get("token")?.trim() ?? "";
  if (!token) {
    try {
      const form = await request.formData();
      token = String(form.get("token") ?? "").trim();
    } catch {
      // body optional
    }
  }
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const result = await optOut(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return new NextResponse("Missing unsubscribe token.", { status: 400 });
  }

  const result = await optOut(token);
  if (!result.ok) {
    return new NextResponse(result.error, { status: 400 });
  }

  const message =
    result.kind === "waitlist"
      ? "You have been unsubscribed from Pact waitlist emails."
      : "You have been unsubscribed from Pact product emails. You can re-enable them in Profile.";

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui;padding:2rem;background:#050505;color:#f5f5f5"><p>${message}</p><p><a href="/app/profile" style="color:#c9ff4a">Open Profile</a></p></body></html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}
