import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "./lib/auth";

export const listForUser = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return rows
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, args.limit ?? 40);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return rows.filter((n) => !n.readAt).length;
  },
});

export const markRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found");
    }
    if (!notification.readAt) {
      await ctx.db.patch(args.notificationId, { readAt: Date.now() });
    }
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const now = Date.now();
    for (const row of rows) {
      if (!row.readAt) {
        await ctx.db.patch(row._id, { readAt: now });
      }
    }
  },
});

/** Soft overdue prompts for the assignee — idempotent per commitment/day */
export const syncRescuePrompts = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const now = Date.now();
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayKey = dayStart.getTime();

    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
      .collect();

    const overdue = commitments.filter(
      (c) =>
        typeof c.dueAt === "number" &&
        c.dueAt < now &&
        c.status !== "done" &&
        c.status !== "paused"
    );

    const existing = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let created = 0;
    for (const commitment of overdue) {
      const already = existing.some(
        (n) =>
          n.type === "rescue_prompt" &&
          n.commitmentId === commitment._id &&
          typeof n.metadata === "object" &&
          n.metadata !== null &&
          "dayKey" in n.metadata &&
          (n.metadata as { dayKey?: number }).dayKey === dayKey
      );
      if (already) continue;

      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "rescue_prompt",
        title: "Rescue available",
        body: `“${commitment.title}” is overdue. Open Rescue Mode when you’re ready.`,
        href: `/rescue/${commitment._id}`,
        pactId: commitment.pactId,
        commitmentId: commitment._id,
        metadata: { dayKey },
      });
      created += 1;
    }

    return { created };
  },
});
