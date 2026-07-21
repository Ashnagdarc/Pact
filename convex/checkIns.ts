import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { checkInSignal, partnerResponseType } from "./lib/validators";
import { notify, notifyPactPartners } from "./lib/notify";

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
          const user = await ctx.db.get(checkIn.userId);
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

          return { checkIn, user, responses: responseDetails };
        })
    );

    return enriched;
  },
});

export const submit = mutation({
  args: {
    commitmentId: v.id("commitments"),
    userId: v.id("users"),
    signal: checkInSignal,
    note: v.optional(v.string()),
    blockerType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const commitment = await ctx.db.get(args.commitmentId);
    if (!commitment) {
      throw new Error("Commitment not found");
    }

    const checkInId = await ctx.db.insert("checkIns", {
      commitmentId: args.commitmentId,
      userId: args.userId,
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
      userId: args.userId,
      pactId: commitment.pactId,
      eventName: "check_in_submitted",
      metadata: {
        commitmentId: args.commitmentId,
        checkInId,
        signal: args.signal,
      },
    });

    const actor = await ctx.db.get(args.userId);
    const actorName = actor?.displayName ?? "Your partner";
    const href = `/commitments/${args.commitmentId}`;

    if (commitment.pactId) {
      const isHelp =
        args.signal === "need_help" || args.signal === "blocked";

      await notifyPactPartners(ctx, {
        pactId: commitment.pactId,
        excludeUserId: args.userId,
        actorId: args.userId,
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
    responderId: v.id("users"),
    responseType: partnerResponseType,
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const checkIn = await ctx.db.get(args.checkInId);
    if (!checkIn) {
      throw new Error("Check-in not found");
    }

    const responseId = await ctx.db.insert("partnerResponses", {
      checkInId: args.checkInId,
      responderId: args.responderId,
      responseType: args.responseType,
      note: args.note,
    });

    const commitment = await ctx.db.get(checkIn.commitmentId);

    await ctx.db.insert("activityEvents", {
      userId: args.responderId,
      pactId: commitment?.pactId,
      eventName: "partner_response_sent",
      metadata: {
        checkInId: args.checkInId,
        responseId,
        responseType: args.responseType,
      },
    });

    const responder = await ctx.db.get(args.responderId);
    await notify(ctx, {
      userId: checkIn.userId,
      actorId: args.responderId,
      type: "partner_response",
      title: "Partner responded",
      body: `${responder?.displayName ?? "Your partner"} replied on “${commitment?.title ?? "your commitment"}”.`,
      href: commitment ? `/commitments/${commitment._id}` : undefined,
      pactId: commitment?.pactId,
      commitmentId: checkIn.commitmentId,
    });

    return responseId;
  },
});
