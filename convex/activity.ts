import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { requireAppUser } from "./lib/auth";

const TIMELINE_EVENTS = new Set([
  "check_in_submitted",
  "partner_response_sent",
  "rescue_mode_started",
  "recovery_plan_created",
  "recovery_plan_approved",
  "commitment_completed",
]);

type Meta = {
  commitmentId?: Id<"commitments">;
  checkInId?: Id<"checkIns">;
  signal?: string;
  responseType?: string;
  blockerType?: string;
  status?: string;
};

/**
 * Accountability day story — check-ins, partner replies, rescue/recovery.
 * Not a social feed (V1 non-goal).
 */
export const todayTimeline = query({
  args: {
    /** Local day start (ms). Client should pass start-of-local-day. */
    since: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const limit = Math.min(args.limit ?? 12, 24);
    const since = args.since;

    const memberships = await ctx.db
      .query("pactMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const acceptedPactIds = memberships
      .filter((m) => m.invitationStatus === "accepted")
      .map((m) => m.pactId);

    const mine = await ctx.db
      .query("activityEvents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const pactEventsNested = await Promise.all(
      acceptedPactIds.map((pactId) =>
        ctx.db
          .query("activityEvents")
          .withIndex("by_pact", (q) => q.eq("pactId", pactId))
          .collect()
      )
    );

    const byId = new Map<string, (typeof mine)[number]>();
    for (const event of [...mine, ...pactEventsNested.flat()]) {
      if (event._creationTime < since) continue;
      if (!TIMELINE_EVENTS.has(event.eventName)) continue;
      byId.set(event._id, event);
    }

    const events = [...byId.values()].sort(
      (a, b) => b._creationTime - a._creationTime
    );

    const items = [];
    for (const event of events.slice(0, limit)) {
      const meta = (event.metadata ?? {}) as Meta;
      let commitmentId = meta.commitmentId;
      let commitmentTitle: string | null = null;
      let href: string | null = null;

      if (!commitmentId && meta.checkInId) {
        const checkIn = await ctx.db.get(meta.checkInId);
        if (checkIn) commitmentId = checkIn.commitmentId;
      }

      if (commitmentId) {
        const commitment = await ctx.db.get(commitmentId);
        if (commitment) {
          commitmentTitle = commitment.title;
          href =
            event.eventName === "rescue_mode_started" ||
            event.eventName === "recovery_plan_created"
              ? `/app/rescue/${commitmentId}`
              : `/app/commitments/${commitmentId}`;
        }
      }

      let actorName: string | null = null;
      let isSelf = false;
      if (event.userId) {
        isSelf = event.userId === user._id;
        if (!isSelf) {
          const actor = await ctx.db.get(event.userId);
          actorName = actor?.displayName ?? "Partner";
        } else {
          actorName = "You";
        }
      }

      let pactTitle: string | null = null;
      if (event.pactId) {
        const pact = await ctx.db.get(event.pactId);
        pactTitle = pact?.title ?? null;
      }

      const { title, detail, tone } = describeEvent({
        eventName: event.eventName,
        commitmentTitle,
        actorName,
        isSelf,
        signal: meta.signal,
        responseType: meta.responseType,
        blockerType: meta.blockerType,
      });

      items.push({
        id: event._id,
        eventName: event.eventName,
        createdAt: event._creationTime,
        title,
        detail,
        tone,
        href,
        pactTitle,
        isSelf,
      });
    }

    return items;
  },
});

function describeEvent(input: {
  eventName: string;
  commitmentTitle: string | null;
  actorName: string | null;
  isSelf: boolean;
  signal?: string;
  responseType?: string;
  blockerType?: string;
}): {
  title: string;
  detail: string;
  tone: "volt" | "signal" | "mint" | "coral" | "ink";
} {
  const subject = input.commitmentTitle
    ? `“${input.commitmentTitle}”`
    : "a commitment";
  const who = input.actorName ?? "Someone";

  switch (input.eventName) {
    case "check_in_submitted": {
      const help =
        input.signal === "need_help" || input.signal === "blocked";
      if (help) {
        return {
          title: input.isSelf
            ? "You asked for help"
            : `${who} asked for help`,
          detail: subject,
          tone: "coral",
        };
      }
      return {
        title: input.isSelf ? "You checked in" : `${who} checked in`,
        detail: `${subject}${input.signal ? ` · ${input.signal.replaceAll("_", " ")}` : ""}`,
        tone: "signal",
      };
    }
    case "partner_response_sent":
      return {
        title: input.isSelf
          ? "You replied to a partner"
          : `${who} replied`,
        detail: subject,
        tone: "volt",
      };
    case "rescue_mode_started":
      return {
        title: input.isSelf ? "You started Rescue" : `${who} started Rescue`,
        detail: input.blockerType
          ? `${subject} · ${input.blockerType.replaceAll("_", " ")}`
          : subject,
        tone: "coral",
      };
    case "recovery_plan_created":
      return {
        title: input.isSelf
          ? "Recovery plan created"
          : `${who} created a recovery plan`,
        detail: subject,
        tone: "volt",
      };
    case "recovery_plan_approved":
      return {
        title: input.isSelf
          ? "You acknowledged a recovery"
          : `${who} acknowledged recovery`,
        detail: subject,
        tone: "mint",
      };
    case "commitment_completed":
      return {
        title: input.isSelf ? "You completed" : `${who} completed`,
        detail: subject,
        tone: "mint",
      };
    default:
      return {
        title: input.eventName.replaceAll("_", " "),
        detail: subject,
        tone: "ink",
      };
  }
}
