"use client";

import {
  healthContributorsFromMetrics,
  type HealthMetricsLike,
  type HealthReasonLike,
} from "@/lib/pact-health-ui";
import { cn } from "@/lib/utils";

type HealthContributorBarsProps = {
  metrics: HealthMetricsLike;
  reasons?: HealthReasonLike[];
  className?: string;
};

function severityFill(severity: "positive" | "warning" | "critical") {
  switch (severity) {
    case "positive":
      return "bg-mint-300";
    case "warning":
      return "bg-volt-500";
    case "critical":
      return "bg-coral-400";
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

/**
 * Contributor mini-bars — explains Pact Health without a mysterious score.
 */
export function HealthContributorBars({
  metrics,
  reasons,
  className,
}: HealthContributorBarsProps) {
  const contributors = healthContributorsFromMetrics(metrics);

  return (
    <div className={cn("space-y-4", className)}>
      <ul className="space-y-3">
        {contributors.map((row) => (
          <li key={row.id} className="min-h-11">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">
                {row.label}
              </span>
              <span className="text-xs font-medium text-white/55">
                {row.detail}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  severityFill(row.severity)
                )}
                style={{ width: `${Math.round(row.value * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {reasons && reasons.length > 0 ? (
        <ul className="space-y-1.5 rounded-[1.25rem] bg-white/5 p-3">
          {reasons.slice(0, 4).map((reason) => (
            <li
              key={reason.code}
              className={cn(
                "text-sm font-medium",
                reason.severity === "positive" && "text-mint-300/90",
                reason.severity === "warning" && "text-white/75",
                reason.severity === "critical" && "text-coral-400"
              )}
            >
              · {reason.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
