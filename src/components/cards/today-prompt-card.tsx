"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import {
  AvatarStack,
  type AvatarPerson,
} from "@/components/feedback/avatar-stack";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type TodayPromptCardProps = {
  people: AvatarPerson[];
  openCount: number;
  blockedCount: number;
  /** Weekly completions — quiet secondary metric inside the single hero. */
  weekCompleted?: number;
  /** Destination for the prompt CTA (blocked → commitment, clear → new, else focus). */
  href?: string;
  className?: string;
};

const PROMPT_CYCLE_MS = 3200;

function promptsForState(openCount: number, blockedCount: number) {
  if (blockedCount > 0) {
    return [
      "Something needs a hand.",
      "A partner is waiting on you.",
      "Unblock one thing today.",
    ];
  }
  if (openCount === 0) {
    return [
      "Clear board. What’s next?",
      "Ready when you are.",
      "Start a small win today.",
    ];
  }
  if (openCount === 1) {
    return [
      "One thing on your plate.",
      "What’s the move today?",
      "Keep it simple.",
    ];
  }
  return [
    "What are you doing today?",
    "Where’s your focus landing?",
    "Pick one commitment to own.",
  ];
}

function eyebrowForState(openCount: number, blockedCount: number) {
  if (blockedCount > 0) return "Needs attention";
  if (openCount === 0) return "Open board";
  if (openCount === 1) return "Today’s move";
  return "Today’s focus";
}

function metaLine(openCount: number, blockedCount: number) {
  if (blockedCount > 0) {
    return blockedCount === 1
      ? "1 commitment needs a hand"
      : `${blockedCount} commitments need a hand`;
  }
  if (openCount === 0) return "Nothing due — add something small";
  if (openCount === 1) return "1 open commitment";
  return `${openCount} open commitments`;
}

export function TodayPromptCard({
  people,
  openCount,
  blockedCount,
  weekCompleted,
  href = "/app/new",
  className,
}: TodayPromptCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const prompts = useMemo(
    () => promptsForState(openCount, blockedCount),
    [openCount, blockedCount]
  );
  const [promptIndex, setPromptIndex] = useState(0);
  const needsAttention = blockedCount > 0;
  const eyebrow = eyebrowForState(openCount, blockedCount);
  const meta = metaLine(openCount, blockedCount);
  const showWeek =
    typeof weekCompleted === "number" && Number.isFinite(weekCompleted);

  useEffect(() => {
    setPromptIndex(0);
  }, [prompts]);

  useEffect(() => {
    if (reduceMotion || prompts.length <= 1) return;
    const timer = window.setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length);
    }, PROMPT_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [prompts, reduceMotion]);

  const prompt = prompts[promptIndex] ?? prompts[0]!;

  return (
    <Link
      href={href}
      className={cn("group block outline-none", className)}
      aria-label={`${eyebrow}. ${prompt}. ${meta}${
        showWeek ? `. ${weekCompleted} kept this week.` : ""
      }`}
    >
      <SurfaceCard
        tone={needsAttention ? "coral" : "ink"}
        padding="none"
        className={cn(
          "relative mb-0 overflow-hidden transition-transform duration-200",
          "group-hover:scale-[1.01] group-active:scale-[0.99]",
          "group-focus-visible:ring-2 group-focus-visible:ring-volt-500/70",
          needsAttention ? "border border-coral-400/20" : "border border-white/10"
        )}
      >
        <div className="flex items-stretch gap-3 px-5 py-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p
                className={cn(
                  "text-[11px] font-semibold tracking-[0.14em] uppercase",
                  needsAttention ? "text-ink-950/70" : "text-volt-500"
                )}
              >
                {eyebrow}
              </p>
              {people.length > 0 ? (
                <AvatarStack people={people} size="sm" className="shrink-0" />
              ) : null}
            </div>

            <div className="relative mt-2.5 min-h-[1.6em]">
              {reduceMotion ? (
                <p
                  className={cn(
                    "font-heading text-2xl font-bold leading-snug tracking-tight",
                    needsAttention ? "text-ink-950" : "text-white"
                  )}
                >
                  {prompt}
                </p>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={prompt}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "font-heading text-2xl font-bold leading-snug tracking-tight",
                      needsAttention ? "text-ink-950" : "text-white"
                    )}
                  >
                    {prompt}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p
                className={cn(
                  "text-sm font-medium",
                  needsAttention ? "text-ink-950/70" : "text-white/65"
                )}
              >
                {meta}
              </p>
              <span
                aria-hidden
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5",
                  needsAttention
                    ? "bg-ink-950 text-white"
                    : "bg-volt-500 text-white"
                )}
              >
                <ArrowRight className="size-4" strokeWidth={2.4} />
              </span>
            </div>
          </div>

          {showWeek ? (
            <div
              className={cn(
                "flex w-[4.75rem] shrink-0 flex-col items-center justify-center rounded-[1.35rem] px-2 py-3",
                needsAttention ? "bg-ink-950/10" : "bg-white/6"
              )}
            >
              <p
                className={cn(
                  "text-display text-[2.75rem] leading-none tracking-[-0.05em]",
                  needsAttention ? "text-ink-950" : "text-white"
                )}
              >
                {weekCompleted}
              </p>
              <p
                className={cn(
                  "mt-1 text-center text-[10px] font-semibold leading-tight uppercase tracking-[0.08em]",
                  needsAttention ? "text-ink-950/60" : "text-white/55"
                )}
              >
                kept
                <br />
                this week
              </p>
            </div>
          ) : null}
        </div>
      </SurfaceCard>
    </Link>
  );
}
