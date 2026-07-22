import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { notify } from "./lib/notify";
import { requireAppUser } from "./lib/auth";

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

    const existingMembership = await ctx.db
      .query("pactMembers")
      .withIndex("by_pact_user", (q) =>
        q.eq("pactId", invitation.pactId).eq("userId", userId)
      )
      .unique();

    if (existingMembership?.invitationStatus === "accepted") {
      await ctx.db.patch(invitation._id, {
        status: "accepted",
        inviteeName: name,
        inviteeUserId: userId,
        acceptedAt: Date.now(),
      });
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
      href: `/pacts/${pact._id}`,
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
    // Token is the capability secret; auth optional for decline.
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
      inviteeName: args.displayName?.trim() || undefined,
      declinedAt: Date.now(),
    });

    await ctx.db.insert("activityEvents", {
      pactId: invitation.pactId,
      eventName: "invitation_declined",
      metadata: { token: args.token },
    });

    return { ok: true as const };
  },
});
