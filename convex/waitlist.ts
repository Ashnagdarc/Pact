import { v } from "convex/values";

import { mutation } from "./_generated/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const join = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new Error("Enter a valid email");
    }

    const existing = await ctx.db
      .query("waitlistSignups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      return { id: existing._id, alreadyJoined: true as const };
    }

    const id = await ctx.db.insert("waitlistSignups", {
      email,
      name: args.name?.trim() || undefined,
      source: args.source?.trim() || "landing",
      createdAt: Date.now(),
    });

    return { id, alreadyJoined: false as const };
  },
});
