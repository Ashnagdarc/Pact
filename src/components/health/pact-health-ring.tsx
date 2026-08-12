"use client";

import { useEffect, useState } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  pactHealthLabel,
  pactHealthRingColor,
  pactHealthRingProgress,
  pactHealthShortLabel,
  type PactHealthStatus,
} from "@/lib/pact-health-ui";
import { cn } from "@/lib/utils";

type PactHealthRingProps = {
  status: PactHealthStatus;
  /** px diameter */
  size?: number;
  className?: string;
  /** Show status word under the ring title area */
  showLabel?: boolean;
  /**
   * onDark — white track + domain hue (default, ink surfaces)
   * onLight — ink track + ink arc (coral/cream/mint cards where domain hue vanishes)
   */
  contrast?: "onDark" | "onLight";
};

/**
 * Pact Health instrument — qualitative arc for status (not an unexplained score).
 * Center shows the PRD health state label.
 */
export function PactHealthRing({
  status,
  size = 168,
  className,
  showLabel = true,
  contrast = "onDark",
}: PactHealthRingProps) {
  const reduceMotion = usePrefersReducedMotion();
  const target = pactHealthRingProgress(status);
  const [progress, setProgress] = useState(reduceMotion ? target : 0);
  const stroke = Math.max(10, Math.round(size * 0.07));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const onLight = contrast === "onLight";
  const trackColor = onLight
    ? "rgba(18, 18, 18, 0.18)"
    : "rgba(255, 255, 255, 0.14)";
  const arcColor = onLight ? "var(--ink-950)" : pactHealthRingColor(status);
  const labelColor = onLight ? "var(--ink-950)" : pactHealthRingColor(status);
  const eyebrowColor = onLight
    ? "rgba(18, 18, 18, 0.55)"
    : "rgba(255, 255, 255, 0.5)";
  const label = pactHealthLabel[status];
  const shortLabel = pactHealthShortLabel[status];

  useEffect(() => {
    if (reduceMotion) {
      setProgress(target);
      return;
    }
    setProgress(0);
    const frame = requestAnimationFrame(() => setProgress(target));
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, target]);

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      style={{ width: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{
            transition: reduceMotion
              ? undefined
              : "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      {showLabel ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p
            className="text-[10px] font-semibold tracking-[0.16em] uppercase"
            style={{ color: eyebrowColor }}
          >
            Pact health
          </p>
          <p
            className="mt-1 font-heading text-lg leading-tight font-bold tracking-tight"
            style={{ color: labelColor }}
          >
            {label}
          </p>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center">
          <p
            className="font-heading text-[11px] leading-tight font-bold tracking-tight"
            style={{ color: labelColor }}
          >
            {shortLabel}
          </p>
        </div>
      )}
      <span className="sr-only">Pact health: {label}</span>
    </div>
  );
}
