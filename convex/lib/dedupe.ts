import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Convex indexes are not unique constraints. Concurrent inserts can create
 * duplicate logical keys. Prefer: query → patch existing → insert only if
 * none; on later reads, keep the oldest row and delete extras (OCC merge).
 */

export async function findByAuthUserId(
  ctx: MutationCtx,
  authUserId: string,
) {
  const rows = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
    .collect();
  // Prefer oldest; do not auto-delete duplicate user rows (may own data).
  if (rows.length === 0) return null;
  return rows.sort((a, b) => a._creationTime - b._creationTime)[0]!;
}

export async function findByEmail(ctx: MutationCtx, email: string) {
  const rows = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();
  if (rows.length === 0) return null;
  return rows.sort((a, b) => a._creationTime - b._creationTime)[0]!;
}

export async function findPactMembership(
  ctx: MutationCtx,
  pactId: Id<"pacts">,
  userId: Id<"users">,
) {
  const rows = await ctx.db
    .query("pactMembers")
    .withIndex("by_pact_user", (q) =>
      q.eq("pactId", pactId).eq("userId", userId),
    )
    .collect();
  if (rows.length <= 1) return rows[0] ?? null;
  const [keep, ...dupes] = rows.sort(
    (a, b) => a._creationTime - b._creationTime,
  );
  for (const d of dupes) {
    await ctx.db.delete(d._id);
  }
  return keep!;
}

export async function findWaitlistByEmail(ctx: MutationCtx, email: string) {
  const rows = await ctx.db
    .query("waitlistSignups")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();
  if (rows.length <= 1) return rows[0] ?? null;
  const [keep, ...dupes] = rows.sort(
    (a, b) => a._creationTime - b._creationTime,
  );
  for (const d of dupes) {
    await ctx.db.delete(d._id);
  }
  return keep!;
}
