import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { cardTone, commitmentStatus } from "./lib/validators";
import {
  requireAppUser,
  requireCommitmentAccess,
  requirePactMember,
} from "./lib/auth";
import { notify } from "./lib/notify";

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

function defaultReminderAt(dueAt?: number) {
  if (!dueAt) return undefined;
  return Math.max(Date.now() + 60_000, dueAt - 60 * 60 * 1000);
}

export const listForToday = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const dayStart = startOfLocalDay();
    const dayEnd = endOfLocalDay();

    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
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
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return await ctx.db
      .query("commitments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
      .collect();
  },
});

export const getById = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const commitment = await requireCommitmentAccess(
      ctx,
      args.commitmentId,
      user._id
    );

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
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const weekStart = startOfWeek();
    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
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
    title: v.string(),
    description: v.optional(v.string()),
    pactId: v.optional(v.id("pacts")),
    dueAt: v.optional(v.number()),
    reminderAt: v.optional(v.number()),
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
    const creator = await requireAppUser(ctx);

    if (args.pactId) {
      await requirePactMember(ctx, args.pactId, creator._id);
      await requirePactMember(ctx, args.pactId, args.assigneeId);
    } else if (args.assigneeId !== creator._id) {
      throw new Error("Cannot assign solo commitments to others");
    }

    const reminderAt = args.reminderAt ?? defaultReminderAt(args.dueAt);

    const commitmentId = await ctx.db.insert("commitments", {
      pactId: args.pactId,
      creatorId: creator._id,
      assigneeId: args.assigneeId,
      title: args.title,
      description: args.description,
      status: "open",
      dueAt: args.dueAt,
      reminderAt,
      evidenceRequired: args.evidenceRequired ?? false,
      favorited: args.favorited ?? false,
      checklist: args.checklist,
      tone: args.tone,
    });

    await ctx.db.insert("activityEvents", {
      userId: creator._id,
      pactId: args.pactId,
      eventName: "commitment_created",
      metadata: { commitmentId, title: args.title },
    });

    if (args.assigneeId !== creator._id) {
      await notify(ctx, {
        userId: args.assigneeId,
        actorId: creator._id,
        type: "partner_update",
        title: "New commitment assigned",
        body: `${creator.displayName} assigned you “${args.title}”.`,
        href: `/app/commitments/${commitmentId}`,
        pactId: args.pactId,
        commitmentId,
      });
    }

    if (reminderAt) {
      await ctx.scheduler.runAfter(
        0,
        internal.reminders.scheduleCommitmentReminder,
        { commitmentId, reminderAt }
      );
    }

    return commitmentId;
  },
});

export const update = mutation({
  args: {
    commitmentId: v.id("commitments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueAt: v.optional(v.union(v.number(), v.null())),
    assigneeId: v.optional(v.id("users")),
    evidenceRequired: v.optional(v.boolean()),
    tone: v.optional(cardTone),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await requireCommitmentAccess(
      ctx,
      args.commitmentId,
      user._id
    );

    if (existing.creatorId !== user._id && existing.assigneeId !== user._id) {
      throw new Error("Forbidden");
    }

    if (args.assigneeId && args.assigneeId !== existing.assigneeId) {
      if (!existing.pactId) {
        throw new Error("Cannot reassign personal commitments");
      }
      await requirePactMember(ctx, existing.pactId, args.assigneeId);
    }

    const dueAt =
      args.dueAt === undefined
        ? existing.dueAt
        : args.dueAt === null
          ? undefined
          : args.dueAt;
    const reminderAt =
      args.dueAt !== undefined ? defaultReminderAt(dueAt) : existing.reminderAt;

    await ctx.db.patch(args.commitmentId, {
      ...(args.title !== undefined ? { title: args.title } : {}),
      ...(args.description !== undefined
        ? { description: args.description }
        : {}),
      ...(args.dueAt !== undefined ? { dueAt } : {}),
      ...(args.assigneeId !== undefined
        ? { assigneeId: args.assigneeId }
        : {}),
      ...(args.evidenceRequired !== undefined
        ? { evidenceRequired: args.evidenceRequired }
        : {}),
      ...(args.tone !== undefined ? { tone: args.tone } : {}),
      ...(args.dueAt !== undefined
        ? { reminderAt, reminderSentAt: undefined }
        : {}),
    });

    if (args.dueAt !== undefined && reminderAt) {
      await ctx.scheduler.runAfter(
        0,
        internal.reminders.scheduleCommitmentReminder,
        { commitmentId: args.commitmentId, reminderAt }
      );
    }
  },
});

export const remove = mutation({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await requireCommitmentAccess(
      ctx,
      args.commitmentId,
      user._id
    );

    if (existing.creatorId !== user._id && existing.assigneeId !== user._id) {
      throw new Error("Forbidden");
    }

    const checkIns = await ctx.db
      .query("checkIns")
      .withIndex("by_commitment", (q) =>
        q.eq("commitmentId", args.commitmentId)
      )
      .collect();

    for (const checkIn of checkIns) {
      const responses = await ctx.db
        .query("partnerResponses")
        .withIndex("by_checkIn", (q) => q.eq("checkInId", checkIn._id))
        .collect();
      for (const response of responses) {
        await ctx.db.delete(response._id);
      }
      await ctx.db.delete(checkIn._id);
    }

    const evidenceRows = await ctx.db
      .query("evidence")
      .withIndex("by_commitment", (q) =>
        q.eq("commitmentId", args.commitmentId)
      )
      .collect();
    for (const row of evidenceRows) {
      await ctx.storage.delete(row.storageId);
      await ctx.db.delete(row._id);
    }

    const plans = await ctx.db
      .query("recoveryPlans")
      .withIndex("by_commitment", (q) =>
        q.eq("commitmentId", args.commitmentId)
      )
      .collect();
    for (const plan of plans) {
      await ctx.db.delete(plan._id);
    }

    await ctx.db.delete(args.commitmentId);
  },
});

export const updateStatus = mutation({
  args: {
    commitmentId: v.id("commitments"),
    status: commitmentStatus,
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await requireCommitmentAccess(
      ctx,
      args.commitmentId,
      user._id
    );

    if (existing.assigneeId !== user._id && existing.creatorId !== user._id) {
      throw new Error("Forbidden");
    }

    if (args.status === "done" && existing.evidenceRequired) {
      const evidence = await ctx.db
        .query("evidence")
        .withIndex("by_commitment", (q) =>
          q.eq("commitmentId", args.commitmentId)
        )
        .first();
      if (!evidence) {
        throw new Error("Evidence is required before marking this done");
      }
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
    const user = await requireAppUser(ctx);
    const existing = await requireCommitmentAccess(
      ctx,
      args.commitmentId,
      user._id
    );

    if (existing.assigneeId !== user._id && existing.creatorId !== user._id) {
      throw new Error("Forbidden");
    }

    if (!existing.checklist) {
      throw new Error("Checklist not found");
    }

    const checklist = existing.checklist.map((item, i) =>
      i === args.index ? { ...item, done: !item.done } : item
    );

    const allDone = checklist.every((item) => item.done);

    if (allDone && existing.evidenceRequired) {
      const evidence = await ctx.db
        .query("evidence")
        .withIndex("by_commitment", (q) =>
          q.eq("commitmentId", args.commitmentId)
        )
        .first();
      if (!evidence) {
        throw new Error("Evidence is required before completing the checklist");
      }
    }

    await ctx.db.patch(args.commitmentId, {
      checklist,
      status: allDone
        ? "done"
        : existing.status === "done"
          ? "on_track"
          : existing.status,
      completedAt: allDone ? Date.now() : undefined,
    });
  },
});

export type CommitmentId = Id<"commitments">;
