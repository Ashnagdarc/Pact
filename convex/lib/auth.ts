import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function getIdentityOrNull(ctx: Ctx) {
  return await ctx.auth.getUserIdentity();
}

export async function requireIdentity(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export async function getAppUserOrNull(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const rows = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .collect();
  if (rows.length === 0) return null;
  return rows.sort((a, b) => a._creationTime - b._creationTime)[0]!;
}

export async function requireAppUser(ctx: Ctx): Promise<Doc<"users">> {
  const identity = await requireIdentity(ctx);
  const rows = await ctx.db
    .query("users")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", identity.subject))
    .collect();
  const user = rows.sort((a, b) => a._creationTime - b._creationTime)[0];

  if (!user) {
    throw new Error("App user not found");
  }

  return user;
}

export async function requirePactMember(
  ctx: Ctx,
  pactId: Id<"pacts">,
  userId: Id<"users">
) {
  const rows = await ctx.db
    .query("pactMembers")
    .withIndex("by_pact_user", (q) =>
      q.eq("pactId", pactId).eq("userId", userId)
    )
    .collect();
  const membership = rows.sort((a, b) => a._creationTime - b._creationTime)[0];

  if (!membership || membership.invitationStatus !== "accepted") {
    throw new Error("Forbidden");
  }

  return membership;
}

export async function requireCommitmentAccess(
  ctx: Ctx,
  commitmentId: Id<"commitments">,
  userId: Id<"users">
) {
  const commitment = await ctx.db.get(commitmentId);
  if (!commitment) {
    throw new Error("Commitment not found");
  }

  if (commitment.assigneeId === userId || commitment.creatorId === userId) {
    return commitment;
  }

  if (commitment.pactId) {
    await requirePactMember(ctx, commitment.pactId, userId);
    return commitment;
  }

  throw new Error("Forbidden");
}
