"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const pairs = [
  {
    issue: "Plans die quietly in your notes app.",
    solution: "Finish what you promise.",
  },
  {
    issue: "Nobody notices when you slip.",
    solution: "A partner who actually checks in.",
  },
  {
    issue: "Missed days turn into abandoned goals.",
    solution: "Rescue Mode gets you back on track.",
  },
  {
    issue: "Task lists can't hold you accountable.",
    solution: "Make a Pact — and show your progress.",
  },
  {
    issue: "Good intentions fade without witnesses.",
    solution: "Recover together when plans change.",
  },
] as const;

const ISSUE_MS = 4200;
const SOLUTION_MS = 5200;

type Phase = "issue" | "solution";

/** Rotating supporting line under the static brand H1 — not a heading. */
export function LandingDynamicHeadline() {
  const reduceMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("solution");

  useEffect(() => {
    if (reduceMotion) {
      setPhase("solution");
      setIndex(0);
      return;
    }

    let timeout: number;
    const schedule = (nextPhase: Phase, delay: number, nextIndex?: number) => {
      timeout = window.setTimeout(() => {
        if (typeof nextIndex === "number") setIndex(nextIndex);
        setPhase(nextPhase);
      }, delay);
    };

    if (phase === "issue") {
      schedule("solution", ISSUE_MS);
    } else {
      schedule("issue", SOLUTION_MS, (index + 1) % pairs.length);
    }

    return () => window.clearTimeout(timeout);
  }, [phase, index, reduceMotion]);

  const pair = pairs[index]!;
  const text = phase === "issue" ? pair.issue : pair.solution;
  const key = `${index}-${phase}`;

  return (
    <p
      className="font-heading relative mt-4 min-h-[3.4em] text-[clamp(1.65rem,4.5vw,2.75rem)] leading-[1.08] font-bold tracking-tight sm:min-h-[2.3em]"
      aria-live="polite"
    >
      {reduceMotion ? (
        <span className="absolute inset-x-0 top-0 block text-white">
          <span className="mb-1.5 block text-xs font-semibold tracking-[0.16em] text-volt-500/90 uppercase">
            With Pact
          </span>
          {pairs[0]!.solution}
        </span>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={key}
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={
              phase === "issue"
                ? "absolute inset-x-0 top-0 block text-white/65"
                : "absolute inset-x-0 top-0 block text-white"
            }
          >
            {phase === "issue" ? (
              <span className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-[0.16em] text-coral-400/90 uppercase">
                  The problem
                </span>
                {text}
              </span>
            ) : (
              <span className="block">
                <span className="mb-1.5 block text-xs font-semibold tracking-[0.16em] text-volt-500/90 uppercase">
                  With Pact
                </span>
                {text}
              </span>
            )}
          </motion.span>
        </AnimatePresence>
      )}
    </p>
  );
}
