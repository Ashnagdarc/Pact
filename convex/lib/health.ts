import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { notifyPactPartners } from "./notify";

type DbCtx = QueryCtx | MutationCtx;

const DAY_MS = 1000 * 60 * 60 * 24;

export function startOfWeek(ms = Date.now()) {
  const d = new Date(ms);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfWeek(ms = Date.now()) {
  return startOfWeek(ms) + DAY_MS * 7 - 1;
}

export type HealthReason = {
  code: string;
  label: string;
  severity: "positive" | "warning" | "critical";
};

export type HealthResult = {
  status: Doc<"pacts">["healthStatus"];
  reasons: HealthReason[];
  metrics: {
    overdueCount: number;
    overdueRate: number;
    helpRequestCount: number;
    checkInsLast7Days: number;
    partnerResponsesLast7Days: number;
    activeMemberCount: number;
    daysSinceActivity: number | null;
    commitmentCount: number;
  };
};

export async function computePactHealth(
  ctx: DbCtx,
  pactId: Id<"pacts">
): Promise<HealthResult | null> {
  const pact = await ctx.db.get(pactId);
  if (!pact) return null;

  if (pact.status === "paused") {
    return {
      status: "paused",
      reasons: [
        {
          code: "paused",
          label: "This Pact is paused by agreement.",
          severity: "warning",
        },
      ],
      metrics: emptyMetrics(),
    };
  }

  if (pact.status === "completed" || pact.status === "ended") {
    return {
      status: "completed",
      reasons: [
        {
          code: "completed",
          label: "Goal marked complete.",
          severity: "positive",
        },
      ],
      metrics: emptyMetrics(),
    };
  }

  const now = Date.now();
  const weekAgo = now - DAY_MS * 7;

  const commitments = await ctx.db
    .query("commitments")
    .withIndex("by_pact", (q) => q.eq("pactId", pactId))
    .collect();

  const activeCommitments = commitments.filter((c) => c.status !== "paused");
  const overdue = activeCommitments.filter(
    (c) =>
      typeof c.dueAt === "number" &&
      c.dueAt < now &&
      c.status !== "done"
  );
  const helpRequests = activeCommitments.filter(
    (c) => c.status === "need_help" || c.status === "blocked"
  );
  const overdueRate =
    activeCommitments.length === 0
      ? 0
      : overdue.length / activeCommitments.length;

  const members = await ctx.db
    .query("pactMembers")
    .withIndex("by_pact", (q) => q.eq("pactId", pactId))
    .collect();
  const acceptedMembers = members.filter(
    (m) => m.invitationStatus === "accepted"
  );

  const events = await ctx.db
    .query("activityEvents")
    .withIndex("by_pact", (q) => q.eq("pactId", pactId))
    .collect();

  const recentEvents = events.filter((e) => e._creationTime >= weekAgo);
  const checkInsLast7Days = recentEvents.filter(
    (e) => e.eventName === "check_in_submitted"
  ).length;
  const partnerResponsesLast7Days = recentEvents.filter(
    (e) => e.eventName === "partner_response_sent"
  ).length;

  const activeUserIds = new Set(
    recentEvents
      .map((e) => e.userId)
      .filter((id): id is Id<"users"> => Boolean(id))
  );
  const activeMemberCount = acceptedMembers.filter((m) =>
    activeUserIds.has(m.userId)
  ).length;

  const lastActivity = events
    .map((e) => e._creationTime)
    .sort((a, b) => b - a)[0];
  const daysSinceActivity =
    typeof lastActivity === "number"
      ? Math.floor((now - lastActivity) / DAY_MS)
      : null;

  const reasons: HealthReason[] = [];

  if (acceptedMembers.length >= 2 && activeMemberCount >= 2) {
    reasons.push({
      code: "both_active",
      label: "Both sides were active this week.",
      severity: "positive",
    });
  } else if (acceptedMembers.length >= 2 && activeMemberCount < 2) {
    reasons.push({
      code: "one_sided",
      label: "Only one side has been active recently.",
      severity: "warning",
    });
  }

  if (helpRequests.length === 0) {
    reasons.push({
      code: "no_help_open",
      label: "No unanswered help requests.",
      severity: "positive",
    });
  } else {
    reasons.push({
      code: "help_open",
      label: `${helpRequests.length} commitment${helpRequests.length === 1 ? "" : "s"} need help or are blocked.`,
      severity: "critical",
    });
  }

  if (overdueRate < 0.2) {
    reasons.push({
      code: "overdue_ok",
      label: `Overdue rate is ${Math.round(overdueRate * 100)}% (under 20%).`,
      severity: "positive",
    });
  } else if (overdue.length === 1) {
    reasons.push({
      code: "one_overdue",
      label: "One commitment is overdue.",
      severity: "warning",
    });
  } else {
    reasons.push({
      code: "many_overdue",
      label: `${overdue.length} commitments are overdue.`,
      severity: "critical",
    });
  }

  if (checkInsLast7Days === 0 && activeCommitments.length > 0) {
    reasons.push({
      code: "no_checkins",
      label: "No check-ins in the last 7 days.",
      severity: "warning",
    });
  }

  if (daysSinceActivity !== null && daysSinceActivity >= 5) {
    reasons.push({
      code: "inactive",
      label: `No activity for ${daysSinceActivity} days.`,
      severity: "critical",
    });
  }

  if (
    partnerResponsesLast7Days === 0 &&
    checkInsLast7Days > 0 &&
    acceptedMembers.length >= 2
  ) {
    reasons.push({
      code: "low_response",
      label: "Partner response rate is low this week.",
      severity: "warning",
    });
  }

  const status = deriveStatus(reasons, {
    overdueCount: overdue.length,
    helpRequestCount: helpRequests.length,
    daysSinceActivity,
  });

  return {
    status,
    reasons,
    metrics: {
      overdueCount: overdue.length,
      overdueRate,
      helpRequestCount: helpRequests.length,
      checkInsLast7Days,
      partnerResponsesLast7Days,
      activeMemberCount,
      daysSinceActivity,
      commitmentCount: activeCommitments.length,
    },
  };
}

function deriveStatus(
  reasons: HealthReason[],
  metrics: {
    overdueCount: number;
    helpRequestCount: number;
    daysSinceActivity: number | null;
  }
): Doc<"pacts">["healthStatus"] {
  const critical = reasons.filter((r) => r.severity === "critical");
  const warnings = reasons.filter((r) => r.severity === "warning");

  if (
    metrics.helpRequestCount > 0 ||
    metrics.overdueCount >= 2 ||
    (metrics.daysSinceActivity !== null && metrics.daysSinceActivity >= 5) ||
    critical.length >= 2
  ) {
    return "at_risk";
  }

  if (warnings.length > 0 || critical.length > 0) {
    return "needs_attention";
  }

  return "healthy";
}

function emptyMetrics(): HealthResult["metrics"] {
  return {
    overdueCount: 0,
    overdueRate: 0,
    helpRequestCount: 0,
    checkInsLast7Days: 0,
    partnerResponsesLast7Days: 0,
    activeMemberCount: 0,
    daysSinceActivity: null,
    commitmentCount: 0,
  };
}

export async function refreshPactHealth(
  ctx: MutationCtx,
  pactId: Id<"pacts">
) {
  const pact = await ctx.db.get(pactId);
  const previous = pact?.healthStatus;
  const result = await computePactHealth(ctx, pactId);
  if (!result) return null;
  await ctx.db.patch(pactId, { healthStatus: result.status });

  // C7: notify partners when health newly enters at_risk.
  if (result.status === "at_risk" && previous !== "at_risk" && pact) {
    await notifyPactPartners(ctx, {
      pactId,
      type: "pact_at_risk",
      title: "Pact at risk",
      body: `“${pact.title}” needs attention — overdue or blocked commitments are stacking up.`,
      href: `/app/pacts/${pactId}`,
    });
  }

  return result;
}
