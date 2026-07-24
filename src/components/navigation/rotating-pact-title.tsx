"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

/** “Pact” / covenant wordmarks across languages (Latin scripts for our UI font). */
export const PACT_WORDMARKS = [
  { word: "Pact", lang: "en", label: "English" },
  { word: "Pacto", lang: "es", label: "Spanish" },
  { word: "Pacte", lang: "fr", label: "French" },
  { word: "Patto", lang: "it", label: "Italian" },
  { word: "Pakt", lang: "de", label: "German" },
  { word: "Majemu", lang: "yo", label: "Yoruba" },
] as const;

const CYCLE_MS = 5500;

type RotatingPactTitleProps = {
  className?: string;
};

export function RotatingPactTitle({ className }: RotatingPactTitleProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % PACT_WORDMARKS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const current = PACT_WORDMARKS[index] ?? PACT_WORDMARKS[0]!;

  return (
    <h1
      className={cn(
        "font-heading text-[2.6rem] leading-none font-extrabold tracking-tight",
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">Pact</span>
      {reduceMotion ? (
        <span aria-hidden lang={current.lang}>
          {current.word}
        </span>
      ) : (
        <span className="relative inline-flex h-[1.1em] items-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={current.word}
              lang={current.lang}
              aria-hidden
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
              title={current.label}
            >
              {current.word}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
    </h1>
  );
}
