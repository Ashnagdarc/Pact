"use client";

import {
  partnerResponseLabel,
  suggestedPartnerResponses,
  type CheckInSignal,
  type PartnerResponseType,
} from "@/lib/check-in";
import { cn } from "@/lib/utils";

type PartnerResponseChipsProps = {
  signal: CheckInSignal;
  disabled?: boolean;
  pendingType?: PartnerResponseType | null;
  onSelect: (type: PartnerResponseType) => void;
  className?: string;
};

/**
 * One-tap partner replies — ranked by the check-in signal.
 */
export function PartnerResponseChips({
  signal,
  disabled,
  pendingType,
  onSelect,
  className,
}: PartnerResponseChipsProps) {
  const types = suggestedPartnerResponses(signal);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {types.map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(type)}
          className={cn(
            "min-h-10 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
            "border-white/15 text-white/80 hover:border-white/40 hover:text-white",
            "disabled:pointer-events-none disabled:opacity-50",
            pendingType === type && "border-signal bg-signal/15 text-signal"
          )}
        >
          {pendingType === type ? "Sending…" : partnerResponseLabel[type]}
        </button>
      ))}
    </div>
  );
}
