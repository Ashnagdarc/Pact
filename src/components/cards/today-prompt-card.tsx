"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { AvatarStack, type AvatarPerson } from "@/components/feedback/avatar-stack";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type TodayPromptCardProps = {
  people: AvatarPerson[];
  openCount: number;
  blockedCount: number;
  className?: string;
};

const PROMPT_CYCLE_MS = 2800;

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

export function TodayPromptCard({
  people,
  openCount,
  blockedCount,
  className,
}: TodayPromptCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const prompts = useMemo(
    () => promptsForState(openCount, blockedCount),
    [openCount, blockedCount]
  );
  const [promptIndex, setPromptIndex] = useState(0);
  const needsAttention = blockedCount > 0;

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
    <div className={cn("prompt-float", className)}>
      <Link href="/app/new" className="group block outline-none">
        <SurfaceCard
          tone="glass"
          className={cn(
            "relative mb-0 flex items-center gap-3 overflow-hidden py-3.5",
            "transition-[border-color,background-color,box-shadow] duration-300",
            "group-hover:border-white/25 group-hover:bg-white/10",
            "group-focus-visible:ring-2 group-focus-visible:ring-volt-500/70",
            needsAttention
              ? "border-coral-400/40 shadow-[0_0_28px_rgba(231,137,101,0.18)]"
              : "shadow-[0_0_24px_rgba(22,133,248,0.12)]"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1/2 left-[-1.5rem] size-28 rounded-full blur-2xl",
              needsAttention
                ? "prompt-glow-attention bg-coral-400/50"
                : "prompt-glow bg-signal/45"
            )}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -top-6 -right-4 size-20 rounded-full bg-volt-500/30 blur-2xl prompt-glow"
          />
          <span
            aria-hidden
            className="prompt-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-transparent via-white/25 to-transparent"
          />

          <div className="relative flex size-11 shrink-0 items-center justify-center">
            <span
              aria-hidden
              className={cn(
                "prompt-ring absolute inset-0 rounded-full",
                needsAttention ? "bg-coral-400/40" : "bg-signal/35"
              )}
            />
            <AvatarStack people={people} size="md" />
          </div>

          <div className="relative min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Sparkles
                className={cn(
                  "prompt-spark size-3.5 shrink-0",
                  needsAttention ? "text-coral-400" : "text-volt-500"
                )}
              />
              <div className="relative h-5 min-w-0 flex-1 overflow-hidden">
                {reduceMotion ? (
                  <p className="truncate text-sm font-semibold text-white">
                    {prompt}
                  </p>
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={prompt}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-x-0 truncate text-sm font-semibold"
                    >
                      {prompt}
                    </motion.p>
                  </AnimatePresence>
                )}
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatPill label="open" value={openCount} tone="volt" />
              <StatPill
                label="need attention"
                value={blockedCount}
                tone={needsAttention ? "coral" : "muted"}
                pulse={needsAttention}
              />
            </div>
          </div>

          <span
            aria-hidden
            className="relative inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white/80"
          >
            <ArrowUpRight className="prompt-arrow size-3.5" />
          </span>
        </SurfaceCard>
      </Link>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
  pulse = false,
}: {
  label: string;
  value: number;
  tone: "volt" | "coral" | "muted";
  pulse?: boolean;
}) {
  const toneClass =
    tone === "volt"
      ? "border-volt-500/30 bg-volt-500/15 text-volt-500"
      : tone === "coral"
        ? "border-coral-400/40 bg-coral-400/15 text-coral-400"
        : "border-white/10 bg-white/5 text-white/55";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        toneClass
      )}
    >
      {pulse ? (
        <span
          aria-hidden
          className="prompt-dot size-1.5 rounded-full bg-coral-400"
        />
      ) : null}
      <span className="tabular-nums">{value}</span>
      <span className="opacity-80">{label}</span>
    </span>
  );
}
