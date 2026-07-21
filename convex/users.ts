import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEMO_EMAIL = "demo@pact.local";

export const getDemoUser = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", DEMO_EMAIL))
      .unique();
  },
});

export const ensureDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", DEMO_EMAIL))
      .unique();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      displayName: "Daniel",
      email: DEMO_EMAIL,
      timezone: "Africa/Lagos",
      onboardingCompleted: true,
      isDemo: true,
    });
  },
});

/**
 * Upsert the Pact `users` row for a Better Auth session user.
 * Called from the client after a verified Better Auth sign-in.
 */
export const ensureAppUser = mutation({
  args: {
    authUserId: v.string(),
    email: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const byAuth = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .unique();

    if (byAuth) {
      await ctx.db.patch(byAuth._id, {
        displayName: args.displayName || byAuth.displayName,
        email: args.email || byAuth.email,
        avatarUrl: args.avatarUrl ?? byAuth.avatarUrl,
        isDemo: false,
      });
      return byAuth._id;
    }

    const byEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (byEmail) {
      await ctx.db.patch(byEmail._id, {
        authUserId: args.authUserId,
        displayName: args.displayName || byEmail.displayName,
        avatarUrl: args.avatarUrl ?? byEmail.avatarUrl,
        isDemo: false,
      });
      return byEmail._id;
    }

    return await ctx.db.insert("users", {
      authUserId: args.authUserId,
      displayName: args.displayName || args.email.split("@")[0] || "Pact user",
      email: args.email,
      avatarUrl: args.avatarUrl,
      timezone: "Africa/Lagos",
      onboardingCompleted: true,
      isDemo: false,
    });
  },
});

export const getByAuthUserId = query({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", args.authUserId))
      .unique();
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
