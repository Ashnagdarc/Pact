"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SurfaceCard } from "@/components/cards/surface-card";
import { StatusChip } from "@/components/feedback/status-chip";
import { WeekBars } from "@/components/insights/week-bars";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { blockerLabel, type BlockerType } from "@/lib/rescue";
import { cn } from "@/lib/utils";

const healthTone = {
  healthy: "mint" as const,
  needs_attention: "volt" as const,
  at_risk: "coral" as const,
  paused: "muted" as const,
  completed: "signal" as const,
};

export function InsightsScreen() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <InsightsScreenConnected />;
}

function InsightsScreenConnected() {
  const { userId, loading: userLoading } = useCurrentUser();
  const overview = useQuery(
    api.insights.weekOverview,
    userId ? {} : "skip"
  );
  const pactHealth = useQuery(
    api.health.forUserPacts,
    userId ? {} : "skip"
  );
  const ensureReview = useMutation(api.insights.ensureReview);
  const refreshHealth = useMutation(api.health.refresh);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (userLoading || overview === undefined || pactHealth === undefined) {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  function saveReview() {
    if (!userId) return;
    startTransition(async () => {
      await ensureReview({});
      for (const row of pactHealth ?? []) {
        if (row) {
          await refreshHealth({ pactId: row.pact._id });
        }
      }
      setSaved(true);
    });
  }

  const weekLabel = `Wk ${format(overview.weekStart, "w")}`;

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-3 pt-2">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            Insights
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Weekly recovery and completion signals.
          </p>
        </div>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70">
          {weekLabel}
        </span>
      </div>

      <SurfaceCard tone="signal" padding="lg" className="mt-6 rounded-[2rem]">
        <p className="text-display text-[5.5rem] leading-none text-white">
          {overview.completedCount}
        </p>
        <p className="mt-2 max-w-[16rem] text-sm font-semibold text-white/85">
          Commitments completed this week. {overview.summary}
        </p>
      </SurfaceCard>

      <SurfaceCard tone="ink" className="mt-4 border border-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Weekly rhythm</h2>
          <span className="text-xs font-semibold text-white/45">
            {overview.checkInCount} check-ins
          </span>
        </div>
        <WeekBars days={overview.dailyCompletions} />
      </SurfaceCard>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricChip label="Open" value={overview.openCount} tone="volt" />
        <MetricChip label="Missed" value={overview.missedCount} tone="coral" />
        <MetricChip
          label="Recovered"
          value={overview.recoveredCount}
          tone="mint"
        />
      </div>

      <SurfaceCard tone="ink" className="mt-4 border border-white/10">
        <h2 className="font-heading text-xl font-bold">Partner pulse</h2>
        <p className="mt-2 text-3xl font-extrabold tracking-tight">
          {Math.round(overview.partnerResponseRate * 100)}%
        </p>
        <p className="mt-1 text-sm text-white/55">
          Response rate on check-ins this week.
        </p>
        {overview.topBlockers.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {overview.topBlockers.map((blocker) => (
              <StatusChip
                key={blocker}
                label={
                  blockerLabel[blocker as BlockerType] ??
                  blocker.replaceAll("_", " ")
                }
                tone="outline"
              />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/45">No rescue blockers logged yet.</p>
        )}
      </SurfaceCard>

      <section className="mt-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Pact health
        </h2>
        <p className="mt-1 text-sm text-white/55">
          Status with reasons — never just a mysterious score.
        </p>
        <div className="mt-4 space-y-3">
          {pactHealth.length === 0 ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="text-sm text-white/65">
                Create a Pact to see shared health signals.
              </p>
              <Button asChild className="mt-3 rounded-full bg-signal text-white">
                <Link href="/pacts/new">Create Pact</Link>
              </Button>
            </SurfaceCard>
          ) : (
            pactHealth.map((row) =>
              row ? (
                <Link key={row.pact._id} href={`/pacts/${row.pact._id}`} className="block">
                  <SurfaceCard
                    tone={row.pact.tone ?? "ink"}
                    className={cn(
                      row.pact.tone ? "" : "border border-white/10",
                      "transition-transform active:scale-[0.99]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-heading text-xl font-bold">
                          {row.pact.title}
                        </p>
                        <StatusChip
                          label={row.health.status.replaceAll("_", " ")}
                          tone={healthTone[row.health.status]}
                          className="mt-2 capitalize"
                        />
                      </div>
                      <p className="text-xs font-semibold opacity-60">
                        {row.health.metrics.checkInsLast7Days} check-ins
                      </p>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {row.health.reasons.slice(0, 3).map((reason) => (
                        <li
                          key={reason.code}
                          className="text-sm font-medium opacity-80"
                        >
                          · {reason.label}
                        </li>
                      ))}
                    </ul>
                  </SurfaceCard>
                </Link>
              ) : null
            )
          )}
        </div>
      </section>

      <Button
        type="button"
        disabled={isPending}
        onClick={saveReview}
        className="mt-6 h-14 w-full rounded-full border-2 border-ink-950 bg-volt-500 text-base font-bold text-ink-950 hover:bg-volt-500/90"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : saved ? (
          "Weekly review saved"
        ) : (
          "Save weekly review"
        )}
      </Button>
    </AppShell>
  );
}

function MetricChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "volt" | "coral" | "mint";
}) {
  return (
    <SurfaceCard
      tone={tone}
      padding="sm"
      className="rounded-[1.25rem] text-center"
    >
      <p className="text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="text-[11px] font-semibold opacity-70">{label}</p>
    </SurfaceCard>
  );
}
