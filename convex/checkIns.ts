import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkInSignal, partnerResponseType } from "./lib/validators";
import { notify, notifyPactPartners } from "./lib/notify";
import {
  requireAppUser,
  requireCommitmentAccess,
  requirePactMember,
} from "./lib/auth";

const CHECK_IN_DEDUP_MS = 15_000;

const signalToStatus = {
  done: "done",
  on_track: "on_track",
  slipping: "slipping",
  blocked: "blocked",
  need_help: "need_help",
} as const;

const signalLabel = {
  done: "done",
  on_track: "on track",
  slipping: "slipping",
  blocked: "blocked",
  need_help: "need help",
} as const;

export const listForCommitment = query({
  args: { commitmentId: v.id("commitments") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    await requireCommitmentAccess(ctx, args.commitmentId, user._id);

    const checkIns = await ctx.db
      .query("checkIns")
      .withIndex("by_commitment", (q) =>
        q.eq("commitmentId", args.commitmentId)
      )
      .collect();

    const enriched = await Promise.all(
      checkIns
        .sort((a, b) => b._creationTime - a._creationTime)
        .map(async (checkIn) => {
          const checkInUser = await ctx.db.get(checkIn.userId);
          const responses = await ctx.db
            .query("partnerResponses")
            .withIndex("by_checkIn", (q) => q.eq("checkInId", checkIn._id))
            .collect();

          const responseDetails = await Promise.all(
            responses.map(async (response) => {
              const responder = await ctx.db.get(response.responderId);
              return { response, responder };
            })
          );

          return { checkIn, user: checkInUser, responses: responseDetails };
        })
    );

    return enriched;
  },
});

export const submit = mutation({
  args: {
    commitmentId: v.id("commitments"),
    signal: checkInSignal,
    note: v.optional(v.string()),
    blockerType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const commitment = await requireCommitmentAccess(
      ctx,
      args.commitmentId,
      user._id
    );

    if (commitment.assigneeId !== user._id) {
      throw new Error("Only the assignee can submit a check-in");
    }

    // B8: reject duplicate submit within a short window (double-tap / retry).
    const recent = await ctx.db
      .query("checkIns")
      .withIndex("by_commitment", (q) =>
        q.eq("commitmentId", args.commitmentId)
      )
      .collect();
    const latestMine = recent
      .filter((row) => row.userId === user._id)
      .sort((a, b) => b._creationTime - a._creationTime)[0];
    if (
      latestMine &&
      Date.now() - latestMine._creationTime < CHECK_IN_DEDUP_MS &&
      latestMine.signal === args.signal
    ) {
      return latestMine._id;
    }

    if (args.signal === "done" && commitment.evidenceRequired) {
      const evidence = await ctx.db
        .query("evidence")
        .withIndex("by_commitment", (q) =>
          q.eq("commitmentId", args.commitmentId)
        )
        .first();
      if (!evidence) {
        throw new Error("Upload evidence before marking this done");
      }
    }

    const checkInId = await ctx.db.insert("checkIns", {
      commitmentId: args.commitmentId,
      userId: user._id,
      signal: args.signal,
      note: args.note,
      blockerType: args.blockerType,
    });

    const nextStatus = signalToStatus[args.signal];
    await ctx.db.patch(args.commitmentId, {
      status: nextStatus,
      completedAt: nextStatus === "done" ? Date.now() : undefined,
    });

    await ctx.db.insert("activityEvents", {
      userId: user._id,
      pactId: commitment.pactId,
      eventName: "check_in_submitted",
      metadata: {
        commitmentId: args.commitmentId,
        checkInId,
        signal: args.signal,
      },
    });

    const actorName = user.displayName;
    const href = `/app/commitments/${args.commitmentId}?reply=1`;

    if (commitment.pactId) {
      const isHelp =
        args.signal === "need_help" || args.signal === "blocked";

      await notifyPactPartners(ctx, {
        pactId: commitment.pactId,
        excludeUserId: user._id,
        actorId: user._id,
        commitmentId: args.commitmentId,
        type: isHelp ? "help_request" : "partner_update",
        title: isHelp ? "Help requested" : "Partner update",
        body: isHelp
          ? `${actorName} marked “${commitment.title}” as ${signalLabel[args.signal]}. Can you help?`
          : `${actorName} marked “${commitment.title}” as ${signalLabel[args.signal]}.`,
        href,
      });
    }

    return checkInId;
  },
});

export const respond = mutation({
  args: {
    checkInId: v.id("checkIns"),
    responseType: partnerResponseType,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const responder = await requireAppUser(ctx);
    const checkIn = await ctx.db.get(args.checkInId);
    if (!checkIn) {
      throw new Error("Check-in not found");
    }

    if (checkIn.userId === responder._id) {
      throw new Error("Cannot respond to your own check-in");
    }

    const commitment = await requireCommitmentAccess(
      ctx,
      checkIn.commitmentId,
      responder._id
    );

    if (commitment.pactId) {
      await requirePactMember(ctx, commitment.pactId, responder._id);
    }

    const existing = await ctx.db
      .query("partnerResponses")
      .withIndex("by_checkIn", (q) => q.eq("checkInId", args.checkInId))
      .collect();
    const mineRecent = existing
      .filter((row) => row.responderId === responder._id)
      .sort((a, b) => b._creationTime - a._creationTime)[0];
    if (
      mineRecent &&
      Date.now() - mineRecent._creationTime < CHECK_IN_DEDUP_MS &&
      mineRecent.responseType === args.responseType
    ) {
      return mineRecent._id;
    }

    const responseId = await ctx.db.insert("partnerResponses", {
      checkInId: args.checkInId,
      responderId: responder._id,
      responseType: args.responseType,
      note: args.note,
    });

    await ctx.db.insert("activityEvents", {
      userId: responder._id,
      pactId: commitment.pactId,
      eventName: "partner_response_sent",
      metadata: {
        checkInId: args.checkInId,
        responseId,
        responseType: args.responseType,
      },
    });

    await notify(ctx, {
      userId: checkIn.userId,
      actorId: responder._id,
      type: "partner_response",
      title: "Partner responded",
      body: `${responder.displayName} replied on “${commitment.title}”.`,
      href: `/app/commitments/${commitment._id}`,
      pactId: commitment.pactId,
      commitmentId: checkIn.commitmentId,
    });

    return responseId;
  },
});
