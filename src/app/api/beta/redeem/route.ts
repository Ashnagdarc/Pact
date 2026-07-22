import { NextResponse } from "next/server";

import { BETA_ACCESS_COOKIE } from "@/lib/beta-access";
import { validateBetaInvite } from "@/lib/convex-http";

type RedeemBody = {
  token?: string;
  code?: string;
};

export async function POST(request: Request) {
  let body: RedeemBody;
  try {
    body = (await request.json()) as RedeemBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = body.token?.trim();
  const code = body.code?.trim();

  if (!token && !code) {
    return NextResponse.json(
      { error: "Enter your 6-digit code or open your access link" },
      { status: 400 },
    );
  }

  try {
    const result = await validateBetaInvite({ token, code });
    if (!result.valid) {
      const message =
        result.reason === "used"
          ? "This invite was already used"
          : "Invalid invite code or link";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const response = NextResponse.json({
      ok: true,
      email: result.email,
      name: result.name ?? null,
      code: result.code,
    });

    response.cookies.set({
      name: BETA_ACCESS_COOKIE,
      value: result.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });

    return response;
  } catch (error) {
    console.error("[beta-redeem] failed", error);
    return NextResponse.json(
      { error: "Could not validate invite. Try again." },
      { status: 502 },
    );
  }
}
