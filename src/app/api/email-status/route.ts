import { NextResponse } from "next/server";

import { getBrevoEnvStatus } from "@/lib/email-flows";

/**
 * Safe health check for Brevo-backed flows.
 * Returns booleans only — never secrets or key material.
 */
export async function GET() {
  const status = getBrevoEnvStatus();
  return NextResponse.json({
    ok: status.allSmtpReady,
    ...status,
  });
}
