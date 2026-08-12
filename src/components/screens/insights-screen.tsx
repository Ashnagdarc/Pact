"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SurfaceCard } from "@/components/cards/surface-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusChip } from "@/components/feedback/status-chip";
import { PactHealthRing } from "@/components/health/pact-health-ring";
import {
  InsightsRangeControl,
  type InsightsRange,
} from "@/components/insights/insights-range-control";
import { WeekBars } from "@/components/insights/week-bars";
import { WeeklyShareCard } from "@/components/insights/weekly-share-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import {
  pactHealthLabel,
  pactHealthTone,
} from "@/lib/pact-health-ui";
import { blockerLabel, type BlockerType } from "@/lib/rescue";
import { cn } from "@/lib/utils";

export function InsightsScreen() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <InsightsScreenConnected />;
}

function InsightsScreenConnected() {
  const { userId, loading: userLoading } = useCurrentUser();
  const [range, setRange] = useState<InsightsRange>(1);
  const overview = useQuery(
    api.insights.weekOverview,
    userId ? { weeks: range } : "skip"
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

  const rangeLabel =
    range === 1
      ? `Wk ${format(overview.weekStart, "w")}`
      : range === 4
        ? "Last 4 weeks"
        : "Last 12 weeks";

  const hasActivity =
    overview.completedCount > 0 ||
    overview.openCount > 0 ||
    overview.checkInCount > 0 ||
    overview.missedCount > 0 ||
    overview.recoveredCount > 0;

  const recoveryPct = Math.round((overview.recoveryRate ?? 0) * 100);
  const partnerPct = Math.round(overview.partnerResponseRate * 100);

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-3 pt-2">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            Insights
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Accountability vitals — completion, recovery, partners.
          </p>
        </div>
        <InsightsRangeControl value={range} onChange={setRange} />
      </div>

      <p className="mt-3 text-xs font-semibold tracking-wide text-white/45 uppercase">
        {rangeLabel}
      </p>

      {!hasActivity ? (
        <EmptyState
          className="mt-6"
          title="No signals in this range"
          description="Check in on commitments or create a Pact to start building insights."
          primaryAction={{ href: "/app", label: "Go to Today" }}
          secondaryAction={{ href: "/app/pacts/new", label: "Create a Pact" }}
        />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <VitalTile
              label="Completed"
              value={overview.completedCount}
              detail={overview.summary}
              tone="signal"
              className="col-span-2"
              large
            />
            <VitalTile
              label="Recovery rate"
              value={`${recoveryPct}%`}
              detail={`${overview.recoveredCount} recovered`}
              tone="mint"
            />
            <VitalTile
              label="Partner pulse"
              value={`${partnerPct}%`}
              detail={`${overview.checkInCount} check-ins`}
              tone="ink"
            />
            <VitalTile
              label="Open"
              value={overview.openCount}
              detail="Still in play"
              tone="volt"
            />
            <VitalTile
              label="Missed"
              value={overview.missedCount}
              detail="Rescue when ready"
              tone="coral"
            />
          </div>

          <SurfaceCard tone="ink" className="mt-4 border border-white/10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">
                {range === 1 ? "Weekly rhythm" : "Range rhythm"}
              </h2>
              <span className="text-xs font-semibold text-white/65">
                {overview.checkInCount} check-ins
              </span>
            </div>
            <WeekBars days={overview.dailyCompletions} />
          </SurfaceCard>

          {overview.topBlockers.length > 0 ? (
            <SurfaceCard tone="ink" className="mt-4 border border-white/10">
              <h2 className="font-heading text-lg font-bold">Top blockers</h2>
              <div className="mt-3 flex flex-wrap gap-2">
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
            </SurfaceCard>
          ) : null}

          <div className="mt-4">
            <WeeklyShareCard
              range={range}
              rangeLabel={rangeLabel}
              completedCount={overview.completedCount}
              recoveryRate={overview.recoveryRate ?? 0}
              partnerResponseRate={overview.partnerResponseRate}
              recoveredCount={overview.recoveredCount}
              checkInCount={overview.checkInCount}
              summary={overview.summary}
            />
          </div>
        </>
      )}

      <section className="mt-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Pact health
        </h2>
        <p className="mt-1 text-sm text-white/55">
          Status with reasons — never just a mysterious score.
        </p>
        <div className="mt-4 space-y-3">
          {pactHealth.length === 0 ? (
            <EmptyState
              size="md"
              title="No Pacts to measure yet"
              description="Create a Pact to see shared health signals here."
              primaryAction={{ href: "/app/pacts/new", label: "Create a Pact" }}
            />
          ) : (
            pactHealth.map((row) =>
              row ? (
                <Link
                  key={row.pact._id}
                  href={`/app/pacts/${row.pact._id}`}
                  className="block"
                >
                  <SurfaceCard
                    tone="ink"
                    className="border border-white/10 transition-transform active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                      <PactHealthRing
                        status={row.health.status}
                        size={88}
                        showLabel={false}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-xl font-bold">
                          {row.pact.title}
                        </p>
                        <StatusChip
                          label={pactHealthLabel[row.health.status]}
                          tone={pactHealthTone[row.health.status]}
                          className="mt-2 capitalize"
                        />
                        <p className="mt-2 text-xs font-semibold text-white/50">
                          {row.health.metrics.checkInsLast7Days} check-ins · 7d
                        </p>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 border-t border-white/8 pt-3">
                      {row.health.reasons.slice(0, 2).map((reason) => (
                        <li
                          key={reason.code}
                          className="text-sm font-medium text-white/70"
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

      {hasActivity ? (
        <Button
          type="button"
          disabled={isPending}
          onClick={saveReview}
          size="xl"
          className="mt-6 w-full"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            "Weekly review saved"
          ) : (
            "Save weekly review"
          )}
        </Button>
      ) : null}
    </AppShell>
  );
}

function VitalTile({
  label,
  value,
  detail,
  tone,
  large,
  className,
}: {
  label: string;
  value: number | string;
  detail: string;
  tone: "volt" | "coral" | "mint" | "signal" | "ink";
  large?: boolean;
  className?: string;
}) {
  return (
    <SurfaceCard
      tone={tone}
      padding={large ? "lg" : "sm"}
      className={cn(
        "rounded-[1.35rem]",
        tone === "ink" && "border border-white/10",
        className
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold tracking-[0.12em] uppercase opacity-70"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-extrabold tracking-tight",
          large
            ? "text-display text-[4.5rem] leading-none"
            : "text-3xl leading-none"
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-2 text-xs font-medium leading-snug opacity-70",
          large && "max-w-[18rem] text-sm"
        )}
      >
        {detail}
      </p>
    </SurfaceCard>
  );
}
