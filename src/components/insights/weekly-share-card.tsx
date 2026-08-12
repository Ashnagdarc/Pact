"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { Button } from "@/components/ui/button";
import type { InsightsRange } from "@/components/insights/insights-range-control";

type WeeklyShareCardProps = {
  range: InsightsRange;
  rangeLabel: string;
  completedCount: number;
  recoveryRate: number;
  partnerResponseRate: number;
  recoveredCount: number;
  checkInCount: number;
  summary: string;
};

function buildShareText(props: WeeklyShareCardProps) {
  const recoveryPct = Math.round(props.recoveryRate * 100);
  const partnerPct = Math.round(props.partnerResponseRate * 100);
  return [
    `Pact review · ${props.rangeLabel}`,
    "",
    `${props.completedCount} commitment${props.completedCount === 1 ? "" : "s"} kept`,
    `Recovery ${recoveryPct}% · ${props.recoveredCount} recovered`,
    `Partner pulse ${partnerPct}% · ${props.checkInCount} check-ins`,
    "",
    props.summary,
    "",
    "Shared privately from Pact",
  ].join("\n");
}

/**
 * Opt-in weekly share card — nothing leaves the device until the user taps
 * Copy or Share (PRD privacy by default).
 */
export function WeeklyShareCard(props: WeeklyShareCardProps) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(
    () =>
      buildShareText({
        range: props.range,
        rangeLabel: props.rangeLabel,
        completedCount: props.completedCount,
        recoveryRate: props.recoveryRate,
        partnerResponseRate: props.partnerResponseRate,
        recoveredCount: props.recoveredCount,
        checkInCount: props.checkInCount,
        summary: props.summary,
      }),
    [
      props.range,
      props.rangeLabel,
      props.completedCount,
      props.recoveryRate,
      props.partnerResponseRate,
      props.recoveredCount,
      props.checkInCount,
      props.summary,
    ]
  );
  const recoveryPct = Math.round(props.recoveryRate * 100);
  const partnerPct = Math.round(props.partnerResponseRate * 100);

  async function copyCard() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  async function shareCard() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pact review · ${props.rangeLabel}`,
          text,
        });
        return;
      } catch {
        // fall through
      }
    }
    await copyCard();
  }

  return (
    <SurfaceCard tone="cream" padding="lg" className="rounded-[2rem]">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-950/50 uppercase">
        Weekly card · private until you share
      </p>
      <p className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-ink-950">
        {props.rangeLabel}
      </p>
      <p className="mt-1 text-sm font-medium text-ink-950/65">{props.summary}</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <ShareStat value={props.completedCount} label="Kept" />
        <ShareStat value={`${recoveryPct}%`} label="Recovery" />
        <ShareStat value={`${partnerPct}%`} label="Partners" />
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="button" variant="default" className="flex-1" onClick={copyCard}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button type="button" variant="outline" className="flex-1 border-ink-950/15 text-ink-950 hover:bg-ink-950/5" onClick={shareCard}>
          <Share2 className="size-4" />
          Share
        </Button>
      </div>
    </SurfaceCard>
  );
}

function ShareStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-[1.15rem] bg-ink-950/6 px-2 py-3 text-center">
      <p className="text-xl font-extrabold tracking-tight text-ink-950">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-ink-950/55 uppercase">
        {label}
      </p>
    </div>
  );
}
