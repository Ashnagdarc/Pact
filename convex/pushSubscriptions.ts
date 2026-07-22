import { v } from "convex/values";

import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireAppUser } from "./lib/auth";

export const listForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    endpoint: v.string(),
    expirationTime: v.optional(v.number()),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: user._id,
        expirationTime: args.expirationTime,
        keys: args.keys,
        userAgent: args.userAgent,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      expirationTime: args.expirationTime,
      keys: args.keys,
      userAgent: args.userAgent,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const remove = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (!existing) return;
    if (existing.userId !== user._id) {
      throw new Error("Not allowed");
    }
    await ctx.db.delete(existing._id);
  },
});

export const removeByEndpoint = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (!existing) return;
    await ctx.db.delete(existing._id);
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
