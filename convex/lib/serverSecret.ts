/**
 * Shared secret for Next.js → Convex server-only mutations.
 * Set `PACT_SERVER_SECRET` in both Vercel and the Convex dashboard
 * (same value). Falls back to `BETTER_AUTH_SECRET` if that is set in Convex.
 */
export function assertServerSecret(secret: string) {
  const expected =
    process.env.PACT_SERVER_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("Unauthorized");
  }
}
