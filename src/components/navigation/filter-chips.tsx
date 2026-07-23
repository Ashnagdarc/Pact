"use client";

import { StatusChip } from "@/components/feedback/status-chip";
import { cn } from "@/lib/utils";

export type FilterOption = {
  id: string;
  label: string;
  count?: number;
};

type FilterChipsProps = {
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function FilterChips({
  options,
  value,
  onChange,
  className,
}: FilterChipsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className="shrink-0"
          >
            <StatusChip
              label={option.label}
              count={option.count}
              tone={active ? "active" : "outline"}
              className={cn(
                "min-h-10 px-4 text-sm",
                !active && "hover:border-white/40"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
