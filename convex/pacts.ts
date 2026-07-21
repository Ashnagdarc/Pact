import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  accountabilityStyle,
  cardTone,
  checkInFrequency,
  memberRole,
} from "./lib/validators";

function createInviteToken() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("pactMembers")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const accepted = memberships.filter(
      (m) => m.invitationStatus === "accepted"
    );

    const boards = await Promise.all(
      accepted.map(async (membership) => {
        const pact = await ctx.db.get(membership.pactId);
        if (!pact || pact.status === "ended") {
          return null;
        }

        const members = await ctx.db
          .query("pactMembers")
          .withIndex("by_pact", (q) => q.eq("pactId", membership.pactId))
          .collect();

        const memberUsers = (
          await Promise.all(members.map((m) => ctx.db.get(m.userId)))
        ).filter(Boolean);

        const commitments = await ctx.db
          .query("commitments")
          .withIndex("by_pact", (q) => q.eq("pactId", membership.pactId))
          .collect();

        const activeTasks = commitments.filter(
          (c) => c.status !== "done" && c.status !== "paused"
        ).length;

        const pendingInvite = await ctx.db
          .query("invitations")
          .withIndex("by_pact", (q) => q.eq("pactId", membership.pactId))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first();

        return {
          pact,
          membership,
          activeTasks,
          inviteToken: pendingInvite?.token ?? null,
          members: memberUsers.map((user) => ({
            name: user!.displayName,
            src: user!.avatarUrl,
          })),
        };
      })
    );

    return boards.filter(Boolean);
  },
});

export const getById = query({
  args: { pactId: v.id("pacts"), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const pact = await ctx.db.get(args.pactId);
    if (!pact) {
      return null;
    }

    const membership = args.userId
      ? await ctx.db
          .query("pactMembers")
          .withIndex("by_pact_user", (q) =>
            q.eq("pactId", args.pactId).eq("userId", args.userId!)
          )
          .unique()
      : null;

    if (!membership || membership.invitationStatus !== "accepted") {
      return { pact: null, forbidden: true as const };
    }

    const owner = await ctx.db.get(pact.ownerId);
    const members = await ctx.db
      .query("pactMembers")
      .withIndex("by_pact", (q) => q.eq("pactId", args.pactId))
      .collect();

    const memberUsers = await Promise.all(
      members.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return user
          ? {
              membership: m,
              user: {
                _id: user._id,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
              },
            }
          : null;
      })
    );

    const pendingInvite = await ctx.db
      .query("invitations")
      .withIndex("by_pact", (q) => q.eq("pactId", args.pactId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_pact", (q) => q.eq("pactId", args.pactId))
      .collect();

    return {
      forbidden: false as const,
      pact,
      owner,
      membership,
      members: memberUsers.filter(Boolean),
      inviteToken: pendingInvite?.token ?? null,
      commitments: commitments.sort(
        (a, b) => (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER)
      ),
    };
  },
});

export const create = mutation({
  args: {
    ownerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    goalType: v.optional(v.string()),
    accountabilityStyle: v.optional(accountabilityStyle),
    checkInFrequency: v.optional(checkInFrequency),
    tone: v.optional(cardTone),
    createInvite: v.optional(v.boolean()),
    inviteRole: v.optional(memberRole),
  },
  handler: async (ctx, args) => {
    const pactId = await ctx.db.insert("pacts", {
      ownerId: args.ownerId,
      title: args.title,
      description: args.description,
      goalType: args.goalType,
      accountabilityStyle: args.accountabilityStyle ?? "supportive",
      checkInFrequency: args.checkInFrequency ?? "daily",
      privacyLevel: "invite_only",
      healthStatus: "healthy",
      status: "active",
      startAt: Date.now(),
      tone: args.tone ?? "signal",
    });

    await ctx.db.insert("pactMembers", {
      pactId,
      userId: args.ownerId,
      role: "owner",
      invitationStatus: "accepted",
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    await ctx.db.insert("activityEvents", {
      userId: args.ownerId,
      pactId,
      eventName: "pact_created",
      metadata: { title: args.title },
    });

    let inviteToken: string | null = null;

    if (args.createInvite !== false) {
      inviteToken = createInviteToken();
      const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 14;

      await ctx.db.insert("invitations", {
        token: inviteToken,
        pactId,
        createdBy: args.ownerId,
        role: args.inviteRole ?? "partner",
        status: "pending",
        expiresAt,
      });

      await ctx.db.insert("activityEvents", {
        userId: args.ownerId,
        pactId,
        eventName: "partner_invited",
        metadata: { token: inviteToken },
      });
    }

    return { pactId, inviteToken };
  },
});

export const createInvite = mutation({
  args: {
    pactId: v.id("pacts"),
    createdBy: v.id("users"),
    role: v.optional(memberRole),
  },
  handler: async (ctx, args) => {
    const pact = await ctx.db.get(args.pactId);
    if (!pact) {
      throw new Error("Pact not found");
    }

    const membership = await ctx.db
      .query("pactMembers")
      .withIndex("by_pact_user", (q) =>
        q.eq("pactId", args.pactId).eq("userId", args.createdBy)
      )
      .unique();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only the owner can create invites");
    }

    // Revoke previous pending invites so one active link is shared
    const pending = await ctx.db
      .query("invitations")
      .withIndex("by_pact", (q) => q.eq("pactId", args.pactId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const invite of pending) {
      await ctx.db.patch(invite._id, { status: "revoked" });
    }

    const token = createInviteToken();
    await ctx.db.insert("invitations", {
      token,
      pactId: args.pactId,
      createdBy: args.createdBy,
      role: args.role ?? "partner",
      status: "pending",
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14,
    });

    await ctx.db.insert("activityEvents", {
      userId: args.createdBy,
      pactId: args.pactId,
      eventName: "partner_invited",
      metadata: { token },
    });

    return token;
  },
});
