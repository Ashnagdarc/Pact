"use client";

import { cn } from "@/lib/utils";

export type InsightsRange = 1 | 4 | 12;

const OPTIONS: { id: InsightsRange; label: string }[] = [
  { id: 1, label: "7D" },
  { id: 4, label: "4W" },
  { id: 12, label: "12W" },
];

type InsightsRangeControlProps = {
  value: InsightsRange;
  onChange: (value: InsightsRange) => void;
  className?: string;
};

export function InsightsRangeControl({
  value,
  onChange,
  className,
}: InsightsRangeControlProps) {
  return (
    <div
      role="tablist"
      aria-label="Insights range"
      className={cn(
        "inline-flex h-9 items-center rounded-full border border-white/12 bg-ink-900 p-0.5",
        className
      )}
    >
      {OPTIONS.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "min-w-11 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-white/12 text-white"
                : "text-white/50 hover:text-white/80"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
