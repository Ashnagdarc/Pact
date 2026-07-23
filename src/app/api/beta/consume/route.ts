import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { BETA_ACCESS_COOKIE } from "@/lib/beta-access";

/**
 * Clears the beta access cookie after signup.
 * Invite claiming is atomic in Better Auth `user.create.before` (claimInvite).
 */
export async function POST() {
  const jar = await cookies();
  const token = jar.get(BETA_ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "No beta invite in session" }, { status: 400 });
  }

  const response = NextResponse.json({
    ok: true,
    cleared: true,
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
}
