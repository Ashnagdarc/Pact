import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { cardTone } from "./lib/validators";
import { requireAppUser } from "./lib/auth";
import { dayBoundsInTimeZone } from "./lib/time";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    return tasks.sort(
      (a, b) => (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER)
    );
  },
});

export const listForToday = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const { start: dayStart, end: dayEnd } = dayBoundsInTimeZone(
      user.timezone || "UTC"
    );
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    return tasks
      .filter((task) => {
        if (task.status === "cancelled") return false;
        if (!task.dueAt) return task.status === "open";
        return task.dueAt >= dayStart && task.dueAt <= dayEnd;
      })
      .sort(
        (a, b) =>
          (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER)
      );
  },
});

export const getById = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.ownerId !== user._id) {
      return null;
    }
    return task;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueAt: v.optional(v.number()),
    reminderAt: v.optional(v.number()),
    favorited: v.optional(v.boolean()),
    tone: v.optional(cardTone),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const taskId = await ctx.db.insert("tasks", {
      ownerId: user._id,
      title: args.title,
      description: args.description,
      status: "open",
      priority: args.priority ?? "medium",
      dueAt: args.dueAt,
      reminderAt: args.reminderAt,
      favorited: args.favorited ?? false,
      tone: args.tone,
    });

    await ctx.db.insert("activityEvents", {
      userId: user._id,
      eventName: "task_created",
      metadata: { taskId, title: args.title },
    });

    return taskId;
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    status: v.optional(
      v.union(v.literal("open"), v.literal("done"), v.literal("cancelled"))
    ),
    dueAt: v.optional(v.union(v.number(), v.null())),
    favorited: v.optional(v.boolean()),
    tone: v.optional(cardTone),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.ownerId !== user._id) {
      throw new Error("Task not found");
    }

    const { taskId, dueAt, ...rest } = args;
    await ctx.db.patch(taskId, {
      ...(rest.title !== undefined ? { title: rest.title } : {}),
      ...(rest.description !== undefined ? { description: rest.description } : {}),
      ...(rest.priority !== undefined ? { priority: rest.priority } : {}),
      ...(rest.status !== undefined ? { status: rest.status } : {}),
      ...(rest.favorited !== undefined ? { favorited: rest.favorited } : {}),
      ...(rest.tone !== undefined ? { tone: rest.tone } : {}),
      ...(dueAt !== undefined ? { dueAt: dueAt ?? undefined } : {}),
    });
  },
});

export const remove = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.ownerId !== user._id) {
      throw new Error("Task not found");
    }
    await ctx.db.delete(args.taskId);
    await ctx.db.insert("activityEvents", {
      userId: user._id,
      eventName: "task_deleted",
      metadata: { taskId: args.taskId },
    });
  },
});
