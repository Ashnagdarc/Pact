"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CheckCircle2,
  HandHelping,
  LifeBuoy,
  MessageCircle,
  Radio,
} from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { cn } from "@/lib/utils";

export type TimelineItem = {
  id: string;
  eventName: string;
  createdAt: number;
  title: string;
  detail: string;
  tone: "volt" | "signal" | "mint" | "coral" | "ink";
  href: string | null;
  pactTitle: string | null;
  isSelf: boolean;
};

type TodayTimelineProps = {
  items: TimelineItem[];
  className?: string;
};

function iconFor(eventName: string) {
  switch (eventName) {
    case "check_in_submitted":
      return Radio;
    case "partner_response_sent":
      return MessageCircle;
    case "rescue_mode_started":
    case "recovery_plan_created":
      return LifeBuoy;
    case "recovery_plan_approved":
    case "commitment_completed":
      return CheckCircle2;
    default:
      return HandHelping;
  }
}

function toneClass(tone: TimelineItem["tone"]) {
  switch (tone) {
    case "volt":
      return "bg-volt-500/15 text-volt-500";
    case "signal":
      return "bg-signal/15 text-signal";
    case "mint":
      return "bg-mint-300/15 text-mint-300";
    case "coral":
      return "bg-coral-400/15 text-coral-400";
    case "ink":
      return "bg-white/10 text-white/70";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}

export function TodayTimeline({ items, className }: TodayTimelineProps) {
  if (items.length === 0) {
    return (
      <SurfaceCard
        tone="ink"
        className={cn("border border-white/10", className)}
      >
        <p className="text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
          Today’s story
        </p>
        <p className="mt-2 font-heading text-lg font-bold tracking-tight">
          Quiet so far
        </p>
        <p className="mt-1 text-sm text-white/60">
          Check-ins, partner replies, and recoveries will show up here.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <section className={className}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Today&apos;s story
        </h2>
        <span className="text-xs font-semibold text-white/55">
          {items.length} update{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <SurfaceCard tone="ink" padding="none" className="border border-white/10">
        <ul className="divide-y divide-white/8">
          {items.map((item) => {
            const Icon = iconFor(item.eventName);
            const body = (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                    toneClass(item.tone)
                  )}
                >
                  <Icon className="size-4" strokeWidth={2.2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <time
                      dateTime={new Date(item.createdAt).toISOString()}
                      className="shrink-0 text-[11px] font-medium text-white/45"
                    >
                      {format(item.createdAt, "h:mm a")}
                    </time>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-white/65">
                    {item.detail}
                  </p>
                  {item.pactTitle ? (
                    <p className="mt-1 text-[11px] font-semibold tracking-wide text-white/40 uppercase">
                      {item.pactTitle}
                    </p>
                  ) : null}
                </div>
              </div>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      </SurfaceCard>
    </section>
  );
}
