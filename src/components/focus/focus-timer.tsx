"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/cards/surface-card";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type FocusTimerProps = {
  /** Max minutes allowed by plan */
  maxMinutes?: number;
  defaultMinutes?: number;
  className?: string;
  label?: string;
};

export function FocusTimer({
  maxMinutes = 25,
  defaultMinutes = 25,
  className,
  label = "Focus timer",
}: FocusTimerProps) {
  const reduceMotion = usePrefersReducedMotion();
  const initial = Math.min(defaultMinutes, maxMinutes) * 60;
  const [secondsLeft, setSecondsLeft] = useState(initial);
  const [running, setRunning] = useState(false);
  const [durationMin, setDurationMin] = useState(
    Math.min(defaultMinutes, maxMinutes)
  );

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function applyMinutes(mins: number) {
    const next = Math.min(Math.max(5, mins), maxMinutes);
    setDurationMin(next);
    setRunning(false);
    setSecondsLeft(next * 60);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress =
    durationMin <= 0 ? 0 : 1 - secondsLeft / (durationMin * 60);

  return (
    <SurfaceCard
      tone="ink"
      className={cn("border border-white/10", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
            {label}
          </p>
          <p
            className={cn(
              "mt-1 font-heading text-4xl font-extrabold tracking-tight tabular-nums",
              secondsLeft === 0 && "text-mint-300"
            )}
          >
            {mm}:{ss}
          </p>
        </div>
        <div
          className="relative size-14 shrink-0"
          aria-hidden
        >
          <svg viewBox="0 0 36 36" className="-rotate-90 size-14">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="var(--volt-500)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${Math.round(progress * 94)} 94`}
              style={{
                transition: reduceMotion ? undefined : "stroke-dasharray 200ms linear",
              }}
            />
          </svg>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[15, 25, 45, 60]
          .filter((m) => m <= maxMinutes)
          .map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => applyMinutes(m)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                durationMin === m
                  ? "border-volt-500 bg-volt-500/20 text-volt-500"
                  : "border-white/15 text-white/65"
              )}
            >
              {m}m
            </button>
          ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant={running ? "outline" : "default"}
          className="flex-1"
          onClick={() => setRunning((r) => !r)}
          disabled={secondsLeft === 0 && !running}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          {running ? "Pause" : secondsLeft === 0 ? "Done" : "Start"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Reset timer"
          onClick={() => applyMinutes(durationMin)}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>
      {maxMinutes < 45 ? (
        <p className="mt-2 text-[11px] text-white/45">
          Free plan caps focus at {maxMinutes}m. Premium unlocks longer sessions.
        </p>
      ) : null}
    </SurfaceCard>
  );
}
