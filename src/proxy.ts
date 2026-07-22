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
  // `/` stays public so marketing/welcome can render for signed-out users.
  // Authenticated Today is gated client-side (and by Convex JWT).
  matcher: [
    "/pacts/:path*",
    "/commitments/:path*",
    "/insights",
    "/notifications",
    "/profile",
    "/new",
    "/rescue/:path*",
  ],
};
