import { v } from "convex/values";

import { mutation, query, type MutationCtx } from "./_generated/server";
import { findWaitlistByEmail } from "./lib/dedupe";
import { assertServerSecret } from "./lib/serverSecret";

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

async function findInvite(
  ctx: MutationCtx,
  args: { token?: string; code?: string },
) {
  const token = args.token?.trim();
  const code = args.code?.trim();

  if (token) {
    return await ctx.db
      .query("waitlistSignups")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
  }
  if (code && /^\d{6}$/.test(code)) {
    return await ctx.db
      .query("waitlistSignups")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
  }
  return null;
}

/**
 * Join waitlist and mint a one-time 6-digit code + unique access token.
 * Server-only: requires `PACT_SERVER_SECRET` (called from Next `/api/waitlist`).
 */
export const join = mutation({
  args: {
    secret: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerSecret(args.secret);

    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new Error("Enter a valid email");
    }

    // B4: collect + merge instead of .unique() so duplicate email rows do not throw.
    const existing = await findWaitlistByEmail(ctx, email);

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
    /** When provided (signup), the invite must belong to this email. */
    email: v.optional(v.string()),
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
    const email = args.email?.trim().toLowerCase();
    if (email && email !== row.email) {
      return { valid: false as const, reason: "email_mismatch" as const };
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

/**
 * Atomically claim a one-time invite (sets usedAt iff unset).
 * Server-only — called from Better Auth `user.create.after` once the user row
 * exists, so a failed signup can never burn the invite. Invites are personal:
 * the claiming email must match the invite's email.
 */
export const claimInvite = mutation({
  args: {
    secret: v.string(),
    token: v.optional(v.string()),
    code: v.optional(v.string()),
    /** Optional for backward compat with older deployed callers; when present, must match the invite's email. */
    email: v.optional(v.string()),
    /** Better Auth user id of the account that consumed the invite. */
    usedByUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertServerSecret(args.secret);

    const row = await findInvite(ctx, args);
    if (!row?.code || !row.token) {
      return { claimed: false as const, reason: "not_found" as const };
    }
    if (row.usedAt) {
      return { claimed: false as const, reason: "used" as const };
    }
    const claimEmail = args.email?.trim().toLowerCase();
    if (claimEmail && claimEmail !== row.email) {
      return { claimed: false as const, reason: "email_mismatch" as const };
    }

    await ctx.db.patch(row._id, {
      usedAt: Date.now(),
      usedByUserId: args.usedByUserId,
    });

    return {
      claimed: true as const,
      email: row.email,
      name: row.name,
      token: row.token,
      code: row.code,
    };
  },
});
