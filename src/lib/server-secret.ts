/**
 * Secret passed from Next.js API/auth hooks into Convex waitlist mutations.
 * Must match Convex `PACT_SERVER_SECRET` (or `BETTER_AUTH_SECRET` on both sides).
 */
export function getPactServerSecret(): string {
  const secret =
    process.env.PACT_SERVER_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "PACT_SERVER_SECRET (or BETTER_AUTH_SECRET) is required for waitlist mutations",
    );
  }
  return secret;
}
