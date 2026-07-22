import { v } from "convex/values";

import { mutation, query, type MutationCtx } from "./_generated/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomCode() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0]! % 900000));
}

function randomToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

async function allocateUniqueCode(ctx: MutationCtx, attempts = 24) {
  for (let i = 0; i < attempts; i++) {
    const code = randomCode();
    const existing = await ctx.db
      .query("waitlistSignups")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (!existing) return code;
  }
  throw new Error("Could not allocate a unique access code");
}

async function allocateUniqueToken(ctx: MutationCtx, attempts = 12) {
  for (let i = 0; i < attempts; i++) {
    const token = randomToken();
    const existing = await ctx.db
      .query("waitlistSignups")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!existing) return token;
  }
  throw new Error("Could not allocate a unique access link");
}

/**
 * Join waitlist and mint a one-time 6-digit code + unique access token.
 * Rejoining the same email returns the existing unused invite (or issues a
 * fresh one if the previous code was already consumed).
 */
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

    if (existing && !existing.usedAt && existing.code && existing.token) {
      if (args.name?.trim() && args.name.trim() !== existing.name) {
        await ctx.db.patch(existing._id, { name: args.name.trim() });
      }
      return {
        id: existing._id,
        alreadyJoined: true as const,
        code: existing.code,
        token: existing.token,
        name: args.name?.trim() || existing.name,
        email,
      };
    }

    const code = await allocateUniqueCode(ctx);
    const token = await allocateUniqueToken(ctx);
    const name = args.name?.trim() || undefined;
    const source = args.source?.trim() || "landing";
    const createdAt = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name,
        source,
        code,
        token,
        createdAt,
        usedAt: undefined,
        usedByUserId: undefined,
      });
      return {
        id: existing._id,
        alreadyJoined: false as const,
        code,
        token,
        name,
        email,
      };
    }

    const id = await ctx.db.insert("waitlistSignups", {
      email,
      name,
      source,
      code,
      token,
      createdAt,
    });

    return {
      id,
      alreadyJoined: false as const,
      code,
      token,
      name,
      email,
    };
  },
});

export const validateInvite = query({
  args: {
    token: v.optional(v.string()),
    code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const token = args.token?.trim();
    const code = args.code?.trim();

    let row = null;
    if (token) {
      row = await ctx.db
        .query("waitlistSignups")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
    } else if (code && /^\d{6}$/.test(code)) {
      row = await ctx.db
        .query("waitlistSignups")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
    }

    if (!row?.code || !row.token) {
      return { valid: false as const, reason: "not_found" as const };
    }
    if (row.usedAt) {
      return { valid: false as const, reason: "used" as const };
    }
    return {
      valid: true as const,
      email: row.email,
      name: row.name,
      code: row.code,
      token: row.token,
    };
  },
});

/** Mark invite as consumed after successful sign-up (one-time use). */
export const consumeInvite = mutation({
  args: {
    token: v.optional(v.string()),
    code: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const token = args.token?.trim();
    const code = args.code?.trim();

    let row = null;
    if (token) {
      row = await ctx.db
        .query("waitlistSignups")
        .withIndex("by_token", (q) => q.eq("token", token))
        .unique();
    } else if (code && /^\d{6}$/.test(code)) {
      row = await ctx.db
        .query("waitlistSignups")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
    }

    if (!row) {
      throw new Error("Invite not found");
    }
    if (row.usedAt) {
      return { consumed: false as const, alreadyUsed: true as const };
    }

    await ctx.db.patch(row._id, {
      usedAt: Date.now(),
      usedByUserId: args.userId,
    });

    return { consumed: true as const, alreadyUsed: false as const };
  },
});
