import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";

/**
 * Validate the Better Auth session (not cookie presence alone).
 * Convex JWT still enforces data access; this soft-gates /app routes.
 * @see https://www.better-auth.com/docs/integrations/next#auth-protection
 */
export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const { pathname } = request.nextUrl;

  if (!session) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  // `/` stays public for the marketing landing page.
  // `/app/onboarding` and `/app/install` stay public (pre-auth / PWA help).
  // Other `/app` surfaces are session-gated; Convex JWT still enforces auth.
  matcher: [
    "/app",
    "/app/pacts/:path*",
    "/app/commitments/:path*",
    "/app/tasks/:path*",
    "/app/insights",
    "/app/notifications",
    "/app/profile",
    "/app/new",
    "/app/rescue/:path*",
  ],
};
