import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type PlanId = "free" | "premium";

const LIMITS = {
  free: { maxCircleMembers: 3 },
  premium: { maxCircleMembers: 12 },
} as const;

export function resolvePlan(plan?: string | null): PlanId {
  return plan === "premium" ? "premium" : "free";
}

export function maxCircleMembers(plan?: string | null): number {
  return LIMITS[resolvePlan(plan)].maxCircleMembers;
}

export async function countAcceptedMembers(
  ctx: QueryCtx | MutationCtx,
  pactId: Id<"pacts">
): Promise<number> {
  const members = await ctx.db
    .query("pactMembers")
    .withIndex("by_pact", (q) => q.eq("pactId", pactId))
    .collect();
  return members.filter((m) => m.invitationStatus === "accepted").length;
}

/** Throws when the owner's plan cannot fit another accepted member. */
export async function assertCircleHasCapacity(
  ctx: QueryCtx | MutationCtx,
  pactId: Id<"pacts">,
  ownerPlan: string | null | undefined
): Promise<void> {
  const accepted = await countAcceptedMembers(ctx, pactId);
  const max = maxCircleMembers(ownerPlan);
  if (accepted >= max) {
    throw new Error(
      `This circle is full (${max} members on the ${resolvePlan(ownerPlan)} plan). Upgrade to Premium for a larger circle.`
    );
  }
}
