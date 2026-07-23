import { ConvexHttpClient } from "convex/browser";

import { getSession } from "@/lib/auth-server";
import { getConvexHttpClient } from "@/lib/convex-http";
import { mintConvexJwt } from "@/lib/convex-jwt";

/**
 * Convex HTTP client authenticated as the current Better Auth session user.
 * Used by Next API routes that must enforce pact/commitment membership.
 */
export async function getAuthedConvexClient(): Promise<{
  convex: ConvexHttpClient;
  authUserId: string;
} | null> {
  const session = await getSession();
  if (!session?.user?.id) {
    return null;
  }

  const token = await mintConvexJwt({
    userId: session.user.id,
    name: session.user.name,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    image: session.user.image,
  });

  const convex = getConvexHttpClient();
  convex.setAuth(token);
  return { convex, authUserId: session.user.id };
}
