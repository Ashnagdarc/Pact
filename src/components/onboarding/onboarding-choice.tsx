"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { playFeedback } from "@/lib/feedback";
import { cn } from "@/lib/utils";

type OnboardingChoiceProps = {
  selected: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  tone?: "glass" | "volt" | "mint" | "coral" | "signal" | "cream";
  index?: number;
  onSelect: () => void;
};

export function OnboardingChoice({
  selected,
  title,
  description,
  icon,
  tone = "glass",
  index = 0,
  onSelect,
}: OnboardingChoiceProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + index * 0.06, duration: 0.35 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        playFeedback({ sound: "select", haptic: "select" });
        onSelect();
      }}
      className="w-full text-left"
    >
      <SurfaceCard
        tone={selected ? "volt" : tone}
        padding="sm"
        className={cn(
          "rounded-2xl border transition-shadow",
          selected
            ? "border-volt-500/40 shadow-[0_12px_32px_rgba(255,247,104,0.14)]"
            : "border-white/8",
        )}
      >
        <div className="flex items-start gap-3">
          {icon ? (
            <motion.span
              animate={selected ? { rotate: [0, -8, 0], scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.35 }}
              className={cn(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-xl",
                selected ? "bg-ink-950/10 text-ink-950" : "bg-white/8 text-volt-500",
              )}
            >
              {icon}
            </motion.span>
          ) : null}
          <div className="min-w-0">
            <p className="font-heading text-[15px] font-bold leading-snug tracking-tight">
              {title}
            </p>
            {description ? (
              <p
                className={cn(
                  "mt-1 text-[13px] leading-relaxed",
                  selected ? "text-ink-950/65" : "text-white/45",
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </motion.button>
  );
}
