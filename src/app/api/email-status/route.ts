import { NextRequest, NextResponse } from "next/server";

import { getBrevoEnvStatus } from "@/lib/email-flows";
import { getPactServerSecret } from "@/lib/server-secret";

/**
 * Ops health check for Brevo-backed flows.
 * Returns booleans only — never secrets or key material.
 * Requires `Authorization: Bearer <PACT_SERVER_SECRET>` (or BETTER_AUTH_SECRET).
 */
export async function GET(request: NextRequest) {
  let expected: string;
  try {
    expected = getPactServerSecret();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  const token =
    auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = getBrevoEnvStatus();
  return NextResponse.json({
    ok: status.allSmtpReady,
    ...status,
  });
}
