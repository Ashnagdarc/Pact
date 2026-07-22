"use client";

import { motion } from "motion/react";

import { onboardingUi } from "@/lib/onboarding-ui";
import { onboardingActs, type OnboardingAct } from "@/lib/onboarding-story";
import { cn } from "@/lib/utils";

type OnboardingActBadgeProps = {
  act: OnboardingAct;
  chapter: string;
  className?: string;
};

const chapterTone: Record<OnboardingAct, string> = {
  "give-up": onboardingUi.chapter.giveUp,
  pact: onboardingUi.chapter.pact,
  yours: onboardingUi.chapter.yours,
};

export function OnboardingActBadge({
  act,
  chapter,
  className,
}: OnboardingActBadgeProps) {
  const { label, title } = onboardingActs[act];

  return (
    <motion.header
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("space-y-2", className)}
    >
      <p className={onboardingUi.eyebrow}>
        {label} · {title}
      </p>
      <p className={chapterTone[act]}>{chapter}</p>
    </motion.header>
  );
}
