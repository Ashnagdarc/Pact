"use client";

import { motion } from "motion/react";

export function OnboardingAmbient() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-volt-500/10 blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -14, 0], y: [0, 10, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 bottom-24 h-44 w-44 rounded-full bg-signal/15 blur-3xl"
      />
    </div>
  );
}
