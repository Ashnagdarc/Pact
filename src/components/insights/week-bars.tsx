"use client";

import { cn } from "@/lib/utils";

type DayBar = {
  day: string;
  count: number;
  target: number;
};

type WeekBarsProps = {
  days: DayBar[];
  className?: string;
};

export function WeekBars({ days, className }: WeekBarsProps) {
  const max = Math.max(2, ...days.map((d) => Math.max(d.count, d.target)));

  return (
    <div className={cn("flex items-end justify-between gap-2", className)}>
      {days.map((day, index) => {
        const height = Math.max(8, Math.round((day.count / max) * 120));
        const tone =
          day.count === 0
            ? "bg-white/15"
            : day.count >= day.target
              ? "bg-signal"
              : "bg-volt-500";

        return (
          <div key={`${day.day}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-white/55">
              {day.count > 0 ? `${Math.min(100, Math.round((day.count / day.target) * 100))}%` : "0%"}
            </span>
            <div className="flex h-[120px] w-full items-end justify-center">
              <div
                className={cn("w-full max-w-8 rounded-t-xl transition-all", tone)}
                style={{ height }}
              />
            </div>
            <span className="text-xs font-semibold text-white/70">{day.day}</span>
          </div>
        );
      })}
    </div>
  );
}
