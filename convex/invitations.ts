import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { notify } from "./lib/notify";
import { requireAppUser } from "./lib/auth";
import { findPactMembership } from "./lib/dedupe";
import { assertServerSecret } from "./lib/serverSecret";

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      return null;
    }

    const pact = await ctx.db.get(invitation.pactId);
    const owner = pact ? await ctx.db.get(pact.ownerId) : null;
    const expired =
      invitation.status === "pending" && invitation.expiresAt < Date.now();

    return {
      invitation: {
        ...invitation,
        status: expired ? ("expired" as const) : invitation.status,
      },
      pact: pact
        ? {
            _id: pact._id,
            title: pact.title,
            description: pact.description,
            goalType: pact.goalType,
            accountabilityStyle: pact.accountabilityStyle,
            checkInFrequency: pact.checkInFrequency,
            privacyLevel: pact.privacyLevel,
            tone: pact.tone,
          }
        : null,
      owner: owner
        ? {
            displayName: owner.displayName,
            avatarUrl: owner.avatarUrl,
          }
        : null,
    };
  },
});

/**
 * Server-only: load invite for email send — includes creator auth id + DB title.
 */
export const getForInviteEmail = query({
  args: {
    secret: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerSecret(args.secret);

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation || invitation.status !== "pending") {
      return null;
    }
    if (invitation.expiresAt < Date.now()) {
      return null;
    }

    const creator = await ctx.db.get(invitation.createdBy);
    const pact = await ctx.db.get(invitation.pactId);
    if (!creator?.authUserId || !pact) {
      return null;
    }

    return {
      createdByAuthUserId: creator.authUserId,
      pactTitle: pact.title,
      inviterName: creator.displayName,
    };
  },
});

export const accept = mutation({
  args: {
    token: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error(`Invitation is ${invitation.status}`);
    }

    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("Invitation has expired");
    }

    const pact = await ctx.db.get(invitation.pactId);
    if (!pact || pact.status === "ended") {
      throw new Error("This Pact is no longer available");
    }

    const name = args.displayName.trim();
    if (name.length < 2) {
      throw new Error("Enter a display name");
    }

    if (user._id === pact.ownerId) {
      throw new Error("You already own this Pact");
    }

    await ctx.db.patch(user._id, { displayName: name });
    const userId = user._id;

    const existingMembership = await findPactMembership(
      ctx,
      invitation.pactId,
      userId,
    );

    if (existingMembership?.invitationStatus === "accepted") {
      // Single-use invite: mark accepted even if already a member.
      if (invitation.status === "pending") {
        await ctx.db.patch(invitation._id, {
          status: "accepted",
          inviteeName: name,
          inviteeUserId: userId,
          acceptedAt: Date.now(),
        });
      }
      return { userId, pactId: invitation.pactId };
    }

    if (existingMembership) {
      await ctx.db.patch(existingMembership._id, {
        invitationStatus: "accepted",
        role: invitation.role === "owner" ? "partner" : invitation.role,
        joinedAt: Date.now(),
        lastActiveAt: Date.now(),
      });
    } else {
      await ctx.db.insert("pactMembers", {
        pactId: invitation.pactId,
        userId,
        role: invitation.role === "owner" ? "partner" : invitation.role,
        invitationStatus: "accepted",
        joinedAt: Date.now(),
        lastActiveAt: Date.now(),
      });
    }

    // Single-use: first accept consumes the invite (B5).
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      inviteeName: name,
      inviteeUserId: userId,
      acceptedAt: Date.now(),
    });

    await ctx.db.insert("activityEvents", {
      userId,
      pactId: invitation.pactId,
      eventName: "invitation_accepted",
      metadata: { token: args.token },
    });

    await notify(ctx, {
      userId: pact.ownerId,
      actorId: userId,
      type: "invitation_accepted",
      title: "Partner joined",
      body: `${name} accepted your invite to “${pact.title}”.`,
      href: `/app/pacts/${pact._id}`,
      pactId: pact._id,
    });

    return { userId, pactId: invitation.pactId };
  },
});

export const decline = mutation({
  args: {
    token: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new Error(`Invitation is ${invitation.status}`);
    }

    await ctx.db.patch(invitation._id, {
      status: "declined",
      declinedAt: Date.now(),
      inviteeName: args.displayName?.trim() || invitation.inviteeName,
    });

    await ctx.db.insert("activityEvents", {
      eventName: "invitation_declined",
      pactId: invitation.pactId,
      metadata: {
        token: args.token,
        inviteeName: args.displayName?.trim() || undefined,
      },
    });

    return { ok: true as const };
  },
});
