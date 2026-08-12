import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  statusIcon,
  statusLabel,
  statusTone,
  type CommitmentStatus,
} from "@/lib/status";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide",
  {
    variants: {
      tone: {
        mint: "border-transparent bg-mint-300 text-ink-950",
        signal: "border-transparent bg-signal text-ink-950",
        volt: "border-transparent bg-volt-500 text-white",
        coral: "border-transparent bg-coral-400 text-ink-950",
        muted: "border-white/15 bg-white/5 text-white/70",
        outline: "border-white/20 bg-transparent text-white",
        active: "border-white bg-ink-950 text-white",
      },
    },
    defaultVariants: {
      tone: "outline",
    },
  }
);

type StatusChipProps = {
  status?: CommitmentStatus;
  label?: string;
  count?: number;
  className?: string;
  /** Hide the status icon (e.g. filter chips that are not status-bound). */
  hideIcon?: boolean;
} & VariantProps<typeof chipVariants>;

export function StatusChip({
  status,
  label,
  count,
  tone,
  className,
  hideIcon = false,
}: StatusChipProps) {
  const resolvedTone = tone ?? (status ? statusTone[status] : "outline");
  const resolvedLabel = label ?? (status ? statusLabel[status] : undefined);
  const Icon = status && !hideIcon ? statusIcon[status] : null;

  return (
    <span className={cn(chipVariants({ tone: resolvedTone }), className)}>
      {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden strokeWidth={2.4} /> : null}
      {resolvedLabel}
      {typeof count === "number" ? (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-black/20 text-[10px] font-bold">
          {count}
        </span>
      ) : null}
    </span>
  );
}

export { chipVariants };
