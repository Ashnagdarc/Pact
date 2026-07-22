"use client";

import { ONBOARDING_STEP_COUNT } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

type OnboardingProgressProps = {
  step: number;
  className?: string;
};

export function OnboardingProgress({ step, className }: OnboardingProgressProps) {
  const progress = ((step + 1) / ONBOARDING_STEP_COUNT) * 100;

  return (
    <div
      className={cn(
        "h-[2px] overflow-hidden rounded-full bg-white/[0.06]",
        className,
      )}
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={ONBOARDING_STEP_COUNT}
      aria-label={`Onboarding step ${step + 1} of ${ONBOARDING_STEP_COUNT}`}
    >
      <div
        className="h-full rounded-full bg-white/30 transition-[width] duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
