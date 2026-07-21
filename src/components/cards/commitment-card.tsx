"use client";

import Link from "next/link";
import { Check, ChevronRight, Heart } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { StatusChip } from "@/components/feedback/status-chip";
import type { CommitmentStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  label: string;
  done?: boolean;
};

type CommitmentCardProps = {
  title: string;
  status?: CommitmentStatus;
  meta?: string;
  items?: ChecklistItem[];
  favorited?: boolean;
  tone?: "coral" | "volt" | "cream" | "mint" | "paper" | "signal";
  className?: string;
  href?: string;
};

export function CommitmentCard({
  title,
  status,
  meta,
  items,
  favorited,
  tone = "cream",
  className,
  href,
}: CommitmentCardProps) {
  const body = (
    <SurfaceCard
      tone={tone}
      className={cn(
        "flex h-full flex-col rounded-[1.75rem]",
        href && "transition-transform active:scale-[0.98]",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          {status ? <StatusChip status={status} className="mb-2" /> : null}
          <h3 className="font-heading text-xl font-bold leading-tight tracking-tight">
            {title}
          </h3>
          {meta ? (
            <p className="mt-1 text-xs font-medium opacity-60">{meta}</p>
          ) : null}
        </div>
        <span
          aria-hidden
          className="inline-flex size-9 items-center justify-center rounded-full bg-black/5"
        >
          <Heart className={cn("size-4", favorited && "fill-current")} />
        </span>
      </div>

      {items?.length ? (
        <ul className="mt-auto space-y-2.5 pt-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center gap-2.5 text-sm font-medium"
            >
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-full border border-current/30",
                  item.done && "bg-ink-950 text-white border-ink-950"
                )}
              >
                {item.done ? <Check className="size-3" /> : null}
              </span>
              <span className={cn(item.done && "line-through opacity-60")}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-auto flex justify-end pt-4">
          <ChevronRight className="size-5 opacity-50" />
        </div>
      )}
    </SurfaceCard>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {body}
      </Link>
    );
  }

  return body;
}
