"use client";

import {
  ONBOARDING_FIRST_STEP,
  ONBOARDING_VISIBLE_STEP_COUNT,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

type OnboardingProgressProps = {
  step: number;
  className?: string;
};

export function OnboardingProgress({ step, className }: OnboardingProgressProps) {
  const visibleStep = Math.max(0, step - ONBOARDING_FIRST_STEP);
  const progress = ((visibleStep + 1) / ONBOARDING_VISIBLE_STEP_COUNT) * 100;

  return (
    <div
      className={cn(
        "h-[2px] overflow-hidden rounded-full bg-white/[0.06]",
        className,
      )}
      role="progressbar"
      aria-valuenow={visibleStep + 1}
      aria-valuemin={1}
      aria-valuemax={ONBOARDING_VISIBLE_STEP_COUNT}
      aria-label={`Onboarding step ${visibleStep + 1} of ${ONBOARDING_VISIBLE_STEP_COUNT}`}
    >
      <div
        className="h-full rounded-full bg-white/30 transition-[width] duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
