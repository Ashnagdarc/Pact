import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic route gate via session cookie presence.
 * Real authorization is enforced in Convex via verified JWTs.
 * @see https://better-auth.com/docs/integrations/next#auth-protection
 */
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  if (!sessionCookie) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  // `/` stays public for the marketing landing page.
  // `/app/onboarding` and `/app/install` stay public (pre-auth / PWA help).
  // Other `/app` surfaces are cookie-gated; Convex JWT still enforces auth.
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
