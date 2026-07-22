import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { mintConvexJwt } from "@/lib/convex-jwt";

/**
 * Issues a Convex-compatible JWT from the Better Auth session cookie.
 * Uses our own ES256 keypair (typ/iss/aud/kid) so Convex customJwt can verify
 * without depending on Better Auth's encrypted JWKS table.
 */
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ token: null }, { status: 401 });
  }

  try {
    const token = await mintConvexJwt({
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("[pact-auth] convex token mint failed", error);
    return NextResponse.json({ token: null }, { status: 500 });
  }
}
