import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { computePactHealth, refreshPactHealth } from "./lib/health";

export const forPact = query({
  args: { pactId: v.id("pacts") },
  handler: async (ctx, args) => {
    return await computePactHealth(ctx, args.pactId);
  },
});

export const refresh = mutation({
  args: { pactId: v.id("pacts") },
  handler: async (ctx, args) => {
    return await refreshPactHealth(ctx, args.pactId);
  },
});

export const forUserPacts = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("pactMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const accepted = memberships.filter(
      (m) => m.invitationStatus === "accepted"
    );

    const results = await Promise.all(
      accepted.map(async (membership) => {
        const pact = await ctx.db.get(membership.pactId);
        if (!pact || pact.status === "ended") return null;
        const health = await computePactHealth(ctx, membership.pactId);
        return health
          ? {
              pact: {
                _id: pact._id,
                title: pact.title,
                tone: pact.tone,
                status: pact.status,
              },
              health,
            }
          : null;
      })
    );

    return results.filter(Boolean);
  },
});
