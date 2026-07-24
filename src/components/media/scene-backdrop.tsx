"use client";

import { cn } from "@/lib/utils";

type SceneBackdropProps = {
  src: string;
  className?: string;
  /** Soft blur like glassmorphism mood boards. */
  blur?: boolean;
  /** Stronger top fade for headers / progress. */
  tone?: "hero" | "story";
  /** Full-viewport layer (onboarding inside a max-width shell). */
  fixed?: boolean;
};

export function SceneBackdrop({
  src,
  className,
  blur = false,
  tone = "story",
  fixed = false,
}: SceneBackdropProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none inset-0 overflow-hidden",
        fixed ? "fixed z-0" : "absolute",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-cover bg-center transition-[filter,transform] duration-700",
          blur ? "scale-110 blur-xl" : "scale-105"
        )}
        style={{ backgroundImage: `url(${src})` }}
      />
      {tone === "hero" ? (
        <>
          <div className="absolute inset-0 bg-ink-950/45" />
          <div className="absolute inset-0 bg-linear-to-b from-ink-950/70 via-ink-950/35 to-ink-950/90" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink-950 via-ink-950/80 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-ink-950/50" />
          <div className="absolute inset-0 bg-linear-to-b from-ink-950/75 via-ink-950/40 to-ink-950/95" />
        </>
      )}
    </div>
  );
}
