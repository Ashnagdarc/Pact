"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { planLimits } from "@/lib/plan";
import { cn } from "@/lib/utils";

function monthBounds(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return {
    startMs: start.getTime(),
    endMs: end.getTime(),
    days: eachDayOfInterval({ start, end }),
  };
}

export function CalendarScreen() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }
  return <CalendarConnected />;
}

function CalendarConnected() {
  const { user, userId, loading } = useCurrentUser();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const bounds = useMemo(() => monthBounds(month), [month]);

  const commitments = useQuery(
    api.commitments.listForDueRange,
    userId
      ? { start: bounds.startMs, end: bounds.endMs }
      : "skip"
  );

  const byDay = useMemo(() => {
    const map = new Map<string, typeof commitments>();
    if (!commitments) return map;
    for (const c of commitments) {
      if (c.dueAt == null) continue;
      const key = format(new Date(c.dueAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    return map;
  }, [commitments]);

  const selectedKey = format(selected, "yyyy-MM-dd");
  const dayItems = byDay.get(selectedKey) ?? [];
  const canExport = planLimits(user?.plan).calendarExport;

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="mb-4 flex items-center justify-between pt-2">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            Calendar
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Due commitments this month
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Previous month"
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Next month"
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </header>

      <p className="mb-3 text-center text-sm font-semibold text-white/75">
        {format(month, "MMMM yyyy")}
      </p>

      <SurfaceCard tone="ink" className="border border-white/10">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold tracking-wide text-white/45 uppercase">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {bounds.days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const count = byDay.get(key)?.length ?? 0;
            const inMonth = isSameMonth(day, month);
            const isSelected = isSameDay(day, selected);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(day)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition-colors",
                  !inMonth && "text-white/25",
                  inMonth && !isSelected && "text-white/80 hover:bg-white/8",
                  isSelected && "bg-volt-500 text-white",
                  isToday && !isSelected && "ring-1 ring-white/35"
                )}
              >
                {format(day, "d")}
                {count > 0 ? (
                  <span
                    className={cn(
                      "absolute bottom-1 size-1 rounded-full",
                      isSelected ? "bg-white" : "bg-signal"
                    )}
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </SurfaceCard>

      <section className="mt-5">
        <h2 className="font-heading text-xl font-bold tracking-tight">
          {format(selected, "EEE, MMM d")}
        </h2>
        {commitments === undefined ? (
          <div className="mt-4 flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-volt-500" />
          </div>
        ) : dayItems.length === 0 ? (
          <SurfaceCard tone="ink" className="mt-3 border border-white/10">
            <p className="text-sm text-white/55">Nothing due this day.</p>
          </SurfaceCard>
        ) : (
          <ul className="mt-3 space-y-2">
            {dayItems.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/app/commitments/${c._id}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/8"
                >
                  <p className="text-sm font-semibold">{c.title}</p>
                  <p className="mt-0.5 text-xs text-white/55">
                    {c.dueAt ? format(c.dueAt, "h:mm a") : "Anytime"} ·{" "}
                    {c.status.replaceAll("_", " ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!canExport ? (
        <p className="mt-6 text-center text-[11px] text-white/45">
          Calendar export is a Premium perk.{" "}
          <Link href="/app/profile" className="underline underline-offset-2">
            View plan
          </Link>
        </p>
      ) : null}
    </AppShell>
  );
}
