import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { endOfWeek, startOfWeek } from "./lib/health";
import { requireAppUser, requirePactMember } from "./lib/auth";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const DAY_MS = 1000 * 60 * 60 * 24;

async function buildWeeklySnapshot(
  ctx: QueryCtx | MutationCtx,
  args: { userId: Id<"users">; pactId?: Id<"pacts"> }
) {
  const weekStart = startOfWeek();
  const weekEnd = endOfWeek();

  let commitments = await ctx.db
    .query("commitments")
    .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
    .collect();

  if (args.pactId) {
    commitments = commitments.filter((c) => c.pactId === args.pactId);
  }

  const completed = commitments.filter(
    (c) =>
      c.status === "done" &&
      typeof c.completedAt === "number" &&
      c.completedAt >= weekStart &&
      c.completedAt <= weekEnd
  );

  const missed = commitments.filter(
    (c) =>
      c.status === "missed" ||
      (typeof c.dueAt === "number" &&
        c.dueAt >= weekStart &&
        c.dueAt <= weekEnd &&
        c.status !== "done" &&
        c.dueAt < Date.now())
  );

  const open = commitments.filter(
    (c) => c.status !== "done" && c.status !== "paused"
  );

  const recoveryPlans = args.pactId
    ? (
        await Promise.all(
          commitments.map((c) =>
            ctx.db
              .query("recoveryPlans")
              .withIndex("by_commitment", (q) => q.eq("commitmentId", c._id))
              .collect()
          )
        )
      ).flat()
    : (
        await ctx.db
          .query("recoveryPlans")
          .withIndex("by_createdBy", (q) => q.eq("createdBy", args.userId))
          .collect()
      );

  const recovered = recoveryPlans.filter(
    (p) => p._creationTime >= weekStart && p._creationTime <= weekEnd
  );

  const blockerCounts = new Map<string, number>();
  for (const plan of recovered) {
    blockerCounts.set(
      plan.blockerType,
      (blockerCounts.get(plan.blockerType) ?? 0) + 1
    );
  }
  const topBlockers = [...blockerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([blocker]) => blocker);

  let events = args.pactId
    ? await ctx.db
        .query("activityEvents")
        .withIndex("by_pact", (q) => q.eq("pactId", args.pactId!))
        .collect()
    : await ctx.db
        .query("activityEvents")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect();

  events = events.filter(
    (e) => e._creationTime >= weekStart && e._creationTime <= weekEnd
  );

  const checkInCount = events.filter(
    (e) => e.eventName === "check_in_submitted"
  ).length;
  const responseCount = events.filter(
    (e) => e.eventName === "partner_response_sent"
  ).length;
  const partnerResponseRate =
    checkInCount === 0 ? 0 : Math.min(1, responseCount / checkInCount);

  const dailyCompletions = DAY_LABELS.map((day, index) => {
    const dayStart = weekStart + index * DAY_MS;
    const dayEnd = dayStart + DAY_MS - 1;
    const count = completed.filter(
      (c) =>
        typeof c.completedAt === "number" &&
        c.completedAt >= dayStart &&
        c.completedAt <= dayEnd
    ).length;
    return { day, count, target: 2 };
  });

  const summary = buildSummary({
    completedCount: completed.length,
    missedCount: missed.length,
    recoveredCount: recovered.length,
    partnerResponseRate,
  });

  return {
    weekStart,
    weekEnd,
    completedCount: completed.length,
    missedCount: missed.length,
    recoveredCount: recovered.length,
    openCount: open.length,
    topBlockers,
    partnerResponseRate,
    checkInCount,
    summary,
    dailyCompletions,
  };
}

function buildSummary(input: {
  completedCount: number;
  missedCount: number;
  recoveredCount: number;
  partnerResponseRate: number;
}) {
  if (input.completedCount === 0 && input.missedCount === 0) {
    return "Quiet week so far. One small commitment can restart momentum.";
  }
  if (input.recoveredCount > 0) {
    return `You recovered ${input.recoveredCount} plan${input.recoveredCount === 1 ? "" : "s"} and kept ${input.completedCount} commitment${input.completedCount === 1 ? "" : "s"}. Stay kind to the process.`;
  }
  if (input.missedCount > input.completedCount) {
    return `${input.missedCount} slipped, ${input.completedCount} finished. Rescue Mode is there when you need it.`;
  }
  return `${input.completedCount} kept this week. Partner response rate ${Math.round(input.partnerResponseRate * 100)}%.`;
}

export const weekOverview = query({
  args: {
    pactId: v.optional(v.id("pacts")),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (args.pactId) {
      await requirePactMember(ctx, args.pactId, user._id);
    }
    return await buildWeeklySnapshot(ctx, {
      userId: user._id,
      pactId: args.pactId,
    });
  },
});

export const ensureReview = mutation({
  args: {
    pactId: v.optional(v.id("pacts")),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (args.pactId) {
      await requirePactMember(ctx, args.pactId, user._id);
    }

    const snapshot = await buildWeeklySnapshot(ctx, {
      userId: user._id,
      pactId: args.pactId,
    });
    const weekStart = snapshot.weekStart;

    if (args.pactId) {
      const existing = await ctx.db
        .query("weeklyReviews")
        .withIndex("by_pact_week", (q) =>
          q.eq("pactId", args.pactId!).eq("weekStart", weekStart)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, snapshot);
        return existing._id;
      }

      const id = await ctx.db.insert("weeklyReviews", {
        ...snapshot,
        pactId: args.pactId,
        userId: user._id,
      });

      await ctx.db.insert("activityEvents", {
        userId: user._id,
        pactId: args.pactId,
        eventName: "weekly_review_completed",
        metadata: { reviewId: id },
      });

      return id;
    }

    const existingRows = await ctx.db
      .query("weeklyReviews")
      .withIndex("by_user_week", (q) =>
        q.eq("userId", user._id).eq("weekStart", weekStart)
      )
      .collect();
    const existing = existingRows.find((row) => !row.pactId);

    if (existing) {
      await ctx.db.patch(existing._id, snapshot);
      return existing._id;
    }

    const id = await ctx.db.insert("weeklyReviews", {
      ...snapshot,
      userId: user._id,
    });

    await ctx.db.insert("activityEvents", {
      userId: user._id,
      eventName: "weekly_review_completed",
      metadata: { reviewId: id },
    });

    return id;
  },
});
