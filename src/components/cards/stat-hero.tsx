"use client";

import { Clock3 } from "lucide-react";
import { motion } from "motion/react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { cn } from "@/lib/utils";

type StatHeroProps = {
  value: number | string;
  label: string;
  hint?: string;
  className?: string;
};

export function StatHero({ value, label, hint, className }: StatHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <SurfaceCard
        tone="volt"
        padding="lg"
        className={cn("min-h-[9.5rem] rounded-[2rem]", className)}
      >
        <div className="flex items-end justify-between gap-4">
          <p className="text-display text-[5.5rem] leading-none tracking-[-0.06em]">
            {value}
          </p>
          <div className="max-w-[9.5rem] pb-1">
            <div className="mb-2 inline-flex size-8 items-center justify-center rounded-full bg-ink-950/10">
              <Clock3 className="size-4" />
            </div>
            <p className="text-sm font-semibold leading-snug">{label}</p>
            {hint ? (
              <p className="mt-1 text-xs font-medium text-ink-950/65">{hint}</p>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </motion.div>
  );
}
