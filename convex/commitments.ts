import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { cardTone, commitmentStatus } from "./lib/validators";

function startOfLocalDay(ms = Date.now()) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfLocalDay(ms = Date.now()) {
  const d = new Date(ms);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function startOfWeek(ms = Date.now()) {
  const d = new Date(ms);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const listForToday = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const dayStart = startOfLocalDay();
    const dayEnd = endOfLocalDay();

    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .collect();

    return commitments
      .filter((c) => {
        if (!c.dueAt) return c.status !== "done" && c.status !== "paused";
        return c.dueAt >= dayStart && c.dueAt <= dayEnd;
      })
      .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
  },
});

export const listForAssignee = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commitments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .collect();
  },
});

export const getById = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) {
      return null;
    }

    const pact = commitment.pactId
      ? await ctx.db.get(commitment.pactId)
      : null;
    const assignee = await ctx.db.get(commitment.assigneeId);
    const creator = await ctx.db.get(commitment.creatorId);

    return {
      commitment,
      pact,
      assignee,
      creator,
    };
  },
});

export const weekStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const weekStart = startOfWeek();
    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .collect();

    const completedThisWeek = commitments.filter(
      (c) =>
        c.status === "done" &&
        typeof c.completedAt === "number" &&
        c.completedAt >= weekStart
    ).length;

    const openCount = commitments.filter(
      (c) => c.status !== "done" && c.status !== "paused"
    ).length;

    const blockedCount = commitments.filter(
      (c) => c.status === "blocked" || c.status === "need_help"
    ).length;

    return {
      completedThisWeek,
      openCount,
      blockedCount,
      total: commitments.length,
    };
  },
});

export const create = mutation({
  args: {
    assigneeId: v.id("users"),
    creatorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    pactId: v.optional(v.id("pacts")),
    dueAt: v.optional(v.number()),
    evidenceRequired: v.optional(v.boolean()),
    favorited: v.optional(v.boolean()),
    tone: v.optional(cardTone),
    checklist: v.optional(
      v.array(
        v.object({
          label: v.string(),
          done: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const commitmentId = await ctx.db.insert("commitments", {
      pactId: args.pactId,
      creatorId: args.creatorId,
      assigneeId: args.assigneeId,
      title: args.title,
      description: args.description,
      status: "open",
      dueAt: args.dueAt,
      evidenceRequired: args.evidenceRequired ?? false,
      favorited: args.favorited ?? false,
      checklist: args.checklist,
      tone: args.tone,
    });

    await ctx.db.insert("activityEvents", {
      userId: args.creatorId,
      pactId: args.pactId,
      eventName: "commitment_created",
      metadata: { commitmentId, title: args.title },
    });

    return commitmentId;
  },
});

export const updateStatus = mutation({
  args: {
    commitmentId: v.id("commitments"),
    status: commitmentStatus,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.commitmentId);
    if (!existing) {
      throw new Error("Commitment not found");
    }

    await ctx.db.patch(args.commitmentId, {
      status: args.status,
      completedAt: args.status === "done" ? Date.now() : undefined,
    });

    await ctx.db.insert("activityEvents", {
      userId: existing.assigneeId,
      pactId: existing.pactId,
      eventName:
        args.status === "done" ? "commitment_completed" : "commitment_updated",
      metadata: { commitmentId: args.commitmentId, status: args.status },
    });
  },
});

export const toggleChecklistItem = mutation({
  args: {
    commitmentId: v.id("commitments"),
    index: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.commitmentId);
    if (!existing?.checklist) {
      throw new Error("Checklist not found");
    }

    const checklist = existing.checklist.map((item, i) =>
      i === args.index ? { ...item, done: !item.done } : item
    );

    const allDone = checklist.every((item) => item.done);

    await ctx.db.patch(args.commitmentId, {
      checklist,
      status: allDone ? "done" : existing.status === "done" ? "on_track" : existing.status,
      completedAt: allDone ? Date.now() : undefined,
    });
  },
});

export type CommitmentId = Id<"commitments">;
