import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  accountabilityStyle,
  checkInFrequency,
} from "./lib/validators";
import {
  getAppUserOrNull,
  requireAppUser,
  requireIdentity,
} from "./lib/auth";

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
  handler: async () => {
    throw new Error(
      "Demo user bootstrap is disabled. Sign in with Better Auth instead."
    );
  },
});

/**
 * Upsert the Pact `users` row for the verified Better Auth identity.
 * Identity comes from the JWT — never from client args.
 */
export const ensureAppUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const authUserId = identity.subject;
    const email = identity.email ?? "";
    const displayName =
      identity.name || email.split("@")[0] || "Pact user";
    const avatarUrl = identity.pictureUrl ?? undefined;

    const byAuth = await ctx.db
      .query("users")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
      .unique();

    if (byAuth) {
      await ctx.db.patch(byAuth._id, {
        displayName: displayName || byAuth.displayName,
        email: email || byAuth.email,
        avatarUrl: avatarUrl ?? byAuth.avatarUrl,
        isDemo: false,
      });
      return byAuth._id;
    }

    if (email) {
      const byEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

      if (byEmail) {
        await ctx.db.patch(byEmail._id, {
          authUserId,
          displayName: displayName || byEmail.displayName,
          avatarUrl: avatarUrl ?? byEmail.avatarUrl,
          isDemo: false,
        });
        return byEmail._id;
      }
    }

    return await ctx.db.insert("users", {
      authUserId,
      displayName,
      email: email || undefined,
      avatarUrl,
      timezone: "Africa/Lagos",
      onboardingCompleted: false,
      isDemo: false,
    });
  },
});

export const completeOnboarding = mutation({
  args: {
    displayName: v.optional(v.string()),
    goalFocus: v.optional(v.string()),
    defaultAccountabilityStyle: v.optional(accountabilityStyle),
    defaultCheckInFrequency: v.optional(checkInFrequency),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
      ...(args.displayName ? { displayName: args.displayName } : {}),
      ...(args.goalFocus ? { goalFocus: args.goalFocus } : {}),
      ...(args.defaultAccountabilityStyle
        ? { defaultAccountabilityStyle: args.defaultAccountabilityStyle }
        : {}),
      ...(args.defaultCheckInFrequency
        ? { defaultCheckInFrequency: args.defaultCheckInFrequency }
        : {}),
    });

    return user._id;
  },
});

/** Current signed-in app user (from JWT subject → users.authUserId). */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    return await getAppUserOrNull(ctx);
  },
});

/** @deprecated Prefer getCurrent — authUserId must not come from the client. */
export const getByAuthUserId = query({
  args: { authUserId: v.string() },
  handler: async (ctx, args) => {
    const me = await getAppUserOrNull(ctx);
    if (!me || me.authUserId !== args.authUserId) {
      return null;
    }
    return me;
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const me = await requireAppUser(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    if (user._id === me._id) {
      return user;
    }

    // Limited public profile for partners (display only).
    return {
      _id: user._id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  },
});

/**
 * Cascade-delete Convex app data for the signed-in user.
 * Call this before Better Auth `deleteUser` so auth + app data stay aligned.
 */
export const deleteAccountData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const userId = user._id;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of notifications) {
      await ctx.db.delete(row._id);
    }

    const pushRows = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of pushRows) {
      await ctx.db.delete(row._id);
    }

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    const memberships = await ctx.db
      .query("pactMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const membership of memberships) {
      const pact = await ctx.db.get(membership.pactId);
      if (pact && pact.ownerId === userId) {
        const commitments = await ctx.db
          .query("commitments")
          .withIndex("by_pact", (q) => q.eq("pactId", pact._id))
          .collect();
        for (const commitment of commitments) {
          await deleteCommitmentTree(ctx, commitment._id);
        }

        const invites = await ctx.db
          .query("invitations")
          .withIndex("by_pact", (q) => q.eq("pactId", pact._id))
          .collect();
        for (const invite of invites) {
          await ctx.db.delete(invite._id);
        }

        const members = await ctx.db
          .query("pactMembers")
          .withIndex("by_pact", (q) => q.eq("pactId", pact._id))
          .collect();
        for (const member of members) {
          await ctx.db.delete(member._id);
        }

        await ctx.db.delete(pact._id);
      } else {
        await ctx.db.delete(membership._id);
      }
    }

    const assigned = await ctx.db
      .query("commitments")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", userId))
      .collect();
    for (const commitment of assigned) {
      if (commitment.creatorId === userId || !commitment.pactId) {
        await deleteCommitmentTree(ctx, commitment._id);
      }
    }

    const events = await ctx.db
      .query("activityEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    const reviews = await ctx.db
      .query("weeklyReviews")
      .withIndex("by_user_week", (q) => q.eq("userId", userId))
      .collect();
    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }

    await ctx.db.delete(userId);
    return { ok: true as const };
  },
});

async function deleteCommitmentTree(
  ctx: MutationCtx,
  commitmentId: Id<"commitments">
) {
  const checkIns = await ctx.db
    .query("checkIns")
    .withIndex("by_commitment", (q) => q.eq("commitmentId", commitmentId))
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
    .withIndex("by_commitment", (q) => q.eq("commitmentId", commitmentId))
    .collect();
  for (const row of evidenceRows) {
    await ctx.storage.delete(row.storageId);
    await ctx.db.delete(row._id);
  }

  const plans = await ctx.db
    .query("recoveryPlans")
    .withIndex("by_commitment", (q) => q.eq("commitmentId", commitmentId))
    .collect();
  for (const plan of plans) {
    await ctx.db.delete(plan._id);
  }

  await ctx.db.delete(commitmentId);
}
