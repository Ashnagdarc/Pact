import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { BETA_ACCESS_COOKIE } from "@/lib/beta-access";
import { consumeBetaInvite } from "@/lib/convex-http";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(BETA_ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "No beta invite in session" }, { status: 400 });
  }

  try {
    const result = await consumeBetaInvite({ token });
    const response = NextResponse.json({
      ok: true,
      consumed: result.consumed,
      alreadyUsed: result.alreadyUsed,
    });
    response.cookies.set({
      name: BETA_ACCESS_COOKIE,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[beta-consume] failed", error);
    return NextResponse.json(
      { error: "Could not consume invite" },
      { status: 502 },
    );
  }
}
