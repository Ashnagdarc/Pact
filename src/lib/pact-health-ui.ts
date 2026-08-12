import type { Doc } from "@convex/_generated/dataModel";

export type PactHealthStatus = Doc<"pacts">["healthStatus"];

export type HealthReasonLike = {
  code: string;
  label: string;
  severity: "positive" | "warning" | "critical";
};

export type HealthMetricsLike = {
  overdueCount: number;
  overdueRate: number;
  helpRequestCount: number;
  checkInsLast7Days: number;
  partnerResponsesLast7Days: number;
  activeMemberCount: number;
  daysSinceActivity: number | null;
  commitmentCount: number;
};

/** Status → surface/chip tone (PRD status map). */
export const pactHealthTone: Record<
  PactHealthStatus,
  "mint" | "volt" | "coral" | "muted" | "signal"
> = {
  healthy: "mint",
  needs_attention: "volt",
  at_risk: "coral",
  paused: "muted",
  completed: "signal",
};

export const pactHealthLabel: Record<PactHealthStatus, string> = {
  healthy: "Healthy",
  needs_attention: "Needs attention",
  at_risk: "At risk",
  paused: "Paused",
  completed: "Completed",
};

/**
 * Qualitative ring fill — encodes state, not a secret 0–100 score.
 * Center of the ring should show the status label, not this number.
 */
export function pactHealthRingProgress(status: PactHealthStatus): number {
  switch (status) {
    case "healthy":
      return 1;
    case "completed":
      return 1;
    case "needs_attention":
      return 0.58;
    case "at_risk":
      return 0.28;
    case "paused":
      return 0.12;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function pactHealthRingColor(status: PactHealthStatus): string {
  switch (status) {
    case "healthy":
      return "var(--mint-300)";
    case "completed":
      return "var(--signal-blue)";
    case "needs_attention":
      return "var(--volt-500)";
    case "at_risk":
      return "var(--coral-400)";
    case "paused":
      return "rgba(255,255,255,0.35)";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export type HealthContributor = {
  id: string;
  label: string;
  /** 0–1 fill */
  value: number;
  detail: string;
  severity: "positive" | "warning" | "critical";
};

/** Oura-style contributor bars mapped to Pact Health metrics (PRD §7.3). */
export function healthContributorsFromMetrics(
  metrics: HealthMetricsLike
): HealthContributor[] {
  const checkInValue = Math.min(1, metrics.checkInsLast7Days / 5);
  const partnerValue =
    metrics.checkInsLast7Days === 0
      ? metrics.partnerResponsesLast7Days > 0
        ? 1
        : 0.35
      : Math.min(
          1,
          metrics.partnerResponsesLast7Days /
            Math.max(1, metrics.checkInsLast7Days)
        );
  const onTimeValue = Math.max(0, 1 - metrics.overdueRate);
  const helpValue =
    metrics.helpRequestCount === 0
      ? 1
      : Math.max(0, 1 - metrics.helpRequestCount / 3);
  const activityValue =
    metrics.daysSinceActivity === null
      ? metrics.commitmentCount === 0
        ? 0.4
        : 0.2
      : metrics.daysSinceActivity <= 1
        ? 1
        : metrics.daysSinceActivity <= 3
          ? 0.7
          : metrics.daysSinceActivity <= 5
            ? 0.4
            : 0.15;

  return [
    {
      id: "checkins",
      label: "Check-ins",
      value: checkInValue,
      detail:
        metrics.checkInsLast7Days === 0
          ? "None in 7 days"
          : `${metrics.checkInsLast7Days} in 7 days`,
      severity:
        checkInValue >= 0.6
          ? "positive"
          : checkInValue >= 0.3
            ? "warning"
            : "critical",
    },
    {
      id: "partner",
      label: "Partner response",
      value: partnerValue,
      detail:
        metrics.checkInsLast7Days === 0
          ? "Waiting on check-ins"
          : `${Math.round(partnerValue * 100)}% of check-ins`,
      severity:
        partnerValue >= 0.6
          ? "positive"
          : partnerValue >= 0.3
            ? "warning"
            : "critical",
    },
    {
      id: "ontime",
      label: "On-time",
      value: onTimeValue,
      detail:
        metrics.overdueCount === 0
          ? "Nothing overdue"
          : `${metrics.overdueCount} overdue`,
      severity:
        onTimeValue >= 0.8
          ? "positive"
          : onTimeValue >= 0.5
            ? "warning"
            : "critical",
    },
    {
      id: "help",
      label: "Help requests",
      value: helpValue,
      detail:
        metrics.helpRequestCount === 0
          ? "None open"
          : `${metrics.helpRequestCount} open`,
      severity:
        metrics.helpRequestCount === 0
          ? "positive"
          : metrics.helpRequestCount === 1
            ? "warning"
            : "critical",
    },
    {
      id: "activity",
      label: "Activity",
      value: activityValue,
      detail:
        metrics.daysSinceActivity === null
          ? "No activity yet"
          : metrics.daysSinceActivity === 0
            ? "Active today"
            : `${metrics.daysSinceActivity}d since last`,
      severity:
        activityValue >= 0.7
          ? "positive"
          : activityValue >= 0.4
            ? "warning"
            : "critical",
    },
  ];
}
