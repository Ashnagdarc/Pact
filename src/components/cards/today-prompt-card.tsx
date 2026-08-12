"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import type { AvatarPerson } from "@/components/feedback/avatar-stack";
import { PactHealthRing } from "@/components/health/pact-health-ring";
import { BadgeAvatar } from "@/components/ui/avatar-badge";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  pactHealthLabel,
  pactHealthRingColor,
  shouldLeadWithPactHealth,
  type FeaturedPactHealth,
} from "@/lib/pact-health-ui";
import { cn } from "@/lib/utils";

type TodayPromptCardProps = {
  people: AvatarPerson[];
  openCount: number;
  blockedCount: number;
  /** Weekly completions — quiet secondary metric when health is calm. */
  weekCompleted?: number;
  /** Worst active Pact Health — ring + optional lead CTA. */
  featuredHealth?: FeaturedPactHealth | null;
  /** Destination for the prompt CTA (blocked → commitment, clear → new, else focus). */
  href?: string;
  className?: string;
};

const PROMPT_CYCLE_MS = 3200;

function promptsForState(
  openCount: number,
  blockedCount: number,
  featured?: FeaturedPactHealth | null
) {
  if (featured && shouldLeadWithPactHealth(featured.status)) {
    if (featured.status === "at_risk") {
      return [
        `${featured.title} needs care.`,
        "A Pact is at risk.",
        "Open the Pact and recover together.",
      ];
    }
    return [
      `${featured.title} needs a look.`,
      "Something’s slipping on a Pact.",
      "Check the reasons, then act.",
    ];
  }
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

function eyebrowForState(
  openCount: number,
  blockedCount: number,
  featured?: FeaturedPactHealth | null
) {
  if (featured && shouldLeadWithPactHealth(featured.status)) {
    return pactHealthLabel[featured.status];
  }
  if (blockedCount > 0) return "Needs attention";
  if (openCount === 0) return "Open board";
  if (openCount === 1) return "Today’s move";
  return "Today’s focus";
}

function metaLine(
  openCount: number,
  blockedCount: number,
  featured?: FeaturedPactHealth | null
) {
  if (featured && shouldLeadWithPactHealth(featured.status)) {
    return featured.topReason ?? featured.title;
  }
  if (blockedCount > 0) {
    return blockedCount === 1
      ? "1 commitment needs a hand"
      : `${blockedCount} commitments need a hand`;
  }
  if (openCount === 0) return "Nothing due. Add something small";
  if (openCount === 1) return "1 open commitment";
  return `${openCount} open commitments`;
}

function ctaLabel(
  openCount: number,
  blockedCount: number,
  featured?: FeaturedPactHealth | null
) {
  if (featured && shouldLeadWithPactHealth(featured.status)) {
    return featured.status === "at_risk" ? "Open Pact" : "Check Pact";
  }
  if (blockedCount > 0) return "Help out";
  if (openCount === 0) return "Add something";
  return "Continue";
}

export function TodayPromptCard({
  people,
  openCount,
  blockedCount,
  weekCompleted,
  featuredHealth,
  href = "/app/new",
  className,
}: TodayPromptCardProps) {
  const reduceMotion = usePrefersReducedMotion();
  const leadHealth =
    featuredHealth && shouldLeadWithPactHealth(featuredHealth.status)
      ? featuredHealth
      : null;
  const prompts = useMemo(
    () => promptsForState(openCount, blockedCount, featuredHealth),
    [openCount, blockedCount, featuredHealth]
  );
  const [promptIndex, setPromptIndex] = useState(0);
  const needsAttention = Boolean(leadHealth) || blockedCount > 0;
  const eyebrow = eyebrowForState(openCount, blockedCount, featuredHealth);
  const meta = metaLine(openCount, blockedCount, featuredHealth);
  const action = ctaLabel(openCount, blockedCount, featuredHealth);
  const showWeek =
    typeof weekCompleted === "number" &&
    Number.isFinite(weekCompleted) &&
    !needsAttention;
  const calmHealth =
    featuredHealth && !leadHealth ? featuredHealth : null;

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
  const cardHref =
    leadHealth != null ? `/app/pacts/${leadHealth.pactId}` : href;

  return (
    <Link
      href={cardHref}
      className={cn("group block outline-none", className)}
      aria-label={`${eyebrow}. ${prompt}. ${meta}${
        showWeek ? `. ${weekCompleted} kept this week.` : ""
      }${
        featuredHealth
          ? `. Pact health ${pactHealthLabel[featuredHealth.status]}.`
          : ""
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
        {!needsAttention ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--volt-500)_18%,transparent),transparent_55%)]"
          />
        ) : null}

        <div className="relative px-5 pt-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <p
              className={cn(
                "text-[11px] font-semibold tracking-[0.14em] uppercase",
                needsAttention ? "text-ink-950/70" : "text-volt-500"
              )}
            >
              {eyebrow}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {calmHealth ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-white/75 uppercase"
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: pactHealthRingColor(calmHealth.status),
                    }}
                  />
                  {pactHealthLabel[calmHealth.status]}
                </span>
              ) : null}
              {people[0] ? (
                <BadgeAvatar
                  name={people[0].name}
                  src={people[0].src}
                  size="default"
                />
              ) : null}
            </div>
          </div>

          {leadHealth ? (
            <div className="mt-4 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <PromptHeadline
                  prompt={prompt}
                  reduceMotion={reduceMotion}
                  needsAttention={needsAttention}
                  size="lg"
                />
              </div>
              <div className="shrink-0 rounded-[1.25rem] bg-ink-950/10 p-1.5">
                <PactHealthRing
                  status={leadHealth.status}
                  size={78}
                  showLabel={false}
                  contrast="onLight"
                />
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <PromptHeadline
                prompt={prompt}
                reduceMotion={reduceMotion}
                needsAttention={needsAttention}
                size="xl"
              />
            </div>
          )}

          <p
            className={cn(
              "mt-3 line-clamp-2 text-sm font-medium",
              needsAttention ? "text-ink-950/65" : "text-white/60"
            )}
          >
            {meta}
          </p>
        </div>

        <div
          className={cn(
            "relative flex items-center justify-between gap-3 border-t px-5 py-3.5",
            needsAttention ? "border-ink-950/10" : "border-white/8"
          )}
        >
          <div className="min-w-0">
            {showWeek ? (
              <p className="text-xs font-medium text-white/45">
                <span className="font-heading text-base font-bold text-white/85">
                  {weekCompleted}
                </span>{" "}
                kept this week
              </p>
            ) : (
              <p
                className={cn(
                  "text-sm font-semibold",
                  needsAttention ? "text-ink-950/80" : "text-white/80"
                )}
              >
                {action}
              </p>
            )}
          </div>

          <span
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-bold transition-transform duration-200 group-hover:translate-x-0.5",
              needsAttention
                ? "bg-ink-950 text-white"
                : "bg-volt-500 text-white"
            )}
          >
            {showWeek ? action : null}
            <ArrowRight className="size-4" strokeWidth={2.4} />
          </span>
        </div>
      </SurfaceCard>
    </Link>
  );
}

function PromptHeadline({
  prompt,
  reduceMotion,
  needsAttention,
  size,
}: {
  prompt: string;
  reduceMotion: boolean;
  needsAttention: boolean;
  size: "lg" | "xl";
}) {
  const className = cn(
    "font-heading font-bold leading-[1.12] tracking-tight",
    size === "xl" ? "text-[1.85rem]" : "text-2xl",
    needsAttention ? "text-ink-950" : "text-white"
  );

  if (reduceMotion) {
    return <p className={className}>{prompt}</p>;
  }

  return (
    <div className="relative min-h-[2.4em]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={prompt}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={className}
        >
          {prompt}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
