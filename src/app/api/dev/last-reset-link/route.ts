import { NextResponse } from "next/server";

import { getCapturedResetLink } from "@/lib/email";

/**
 * Dev/test helper: returns the last password-reset link captured by
 * `sendResetPassword` when Brevo is not configured.
 * Disabled in production unless PACT_CAPTURE_RESET_LINKS=1.
 */
export async function GET() {
  const allowed =
    process.env.PACT_CAPTURE_RESET_LINKS === "1" ||
    process.env.NODE_ENV !== "production";

  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const link = getCapturedResetLink();
  if (!link) {
    return NextResponse.json({ link: null });
  }

  return NextResponse.json({ link });
}
