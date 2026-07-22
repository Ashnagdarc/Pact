"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { playUiSound, soundForPreviewTone } from "@/lib/ui-sounds";
import { cn } from "@/lib/utils";

type PreviewCard = {
  title: string;
  meta: string;
  tone: "mint" | "coral" | "volt" | "cream" | "signal";
};

const previewDeck: PreviewCard[] = [
  { title: "Morning mobility", meta: "On track", tone: "mint" },
  { title: "Ship landing page", meta: "Due today", tone: "coral" },
  { title: "12 kept this week", meta: "Your streak", tone: "volt" },
  { title: "Evening journal", meta: "Paused", tone: "cream" },
  { title: "Call Alex", meta: "Need help", tone: "signal" },
];

const CYCLE_MS = 3200;

export function WelcomePreviewStack() {
  const [index, setIndex] = useState(0);
  const [soundReady, setSoundReady] = useState(false);
  const prevIndex = useRef(index);

  const current = previewDeck[index]!;
  const next = previewDeck[(index + 1) % previewDeck.length]!;

  useEffect(() => {
    const enableSound = () => setSoundReady(true);
    window.addEventListener("pointerdown", enableSound, { once: true });
    return () => window.removeEventListener("pointerdown", enableSound);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % previewDeck.length);
    }, CYCLE_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!soundReady || prevIndex.current === index) return;
    prevIndex.current = index;
    playUiSound(soundForPreviewTone(current.tone));
  }, [index, soundReady, current.tone]);

  return (
    <div
      className="relative mx-auto h-[6.75rem] w-full max-w-[17rem]"
      aria-live="polite"
      aria-atomic="true"
    >
      <motion.div
        key={`peek-${next.title}`}
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 0.45, y: 10, scale: 0.96, rotate: 2.5 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-x-2 top-3"
      >
        <SurfaceCard
          tone={next.tone}
          padding="sm"
          className="rounded-[1.35rem] shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
        >
          <p className="text-[0.65rem] font-bold tracking-[0.1em] uppercase opacity-60">
            {next.meta}
          </p>
          <p className="font-heading mt-1 text-base leading-tight font-bold tracking-tight">
            {next.title}
          </p>
        </SurfaceCard>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.title}
          initial={{ opacity: 0, y: 36, rotate: 5, scale: 0.92 }}
          animate={{
            opacity: 1,
            y: 0,
            rotate: -1.5,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: -40,
            rotate: -4,
            scale: 0.94,
            filter: "blur(2px)",
          }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 top-0 z-10"
          onPointerDown={() => {
            if (!soundReady) setSoundReady(true);
            setIndex((prev) => (prev + 1) % previewDeck.length);
          }}
        >
          <SurfaceCard
            tone={current.tone}
            padding="sm"
            className={cn(
              "cursor-pointer rounded-[1.35rem] shadow-[0_18px_40px_rgba(0,0,0,0.35)]",
              "transition-transform active:scale-[0.98]",
            )}
          >
            <motion.p
              key={`${current.title}-meta`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 0.65, x: 0 }}
              transition={{ delay: 0.08, duration: 0.3 }}
              className="text-[0.65rem] font-bold tracking-[0.1em] uppercase"
            >
              {current.meta}
            </motion.p>
            <motion.p
              key={`${current.title}-title`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="font-heading mt-1 text-lg leading-tight font-bold tracking-tight"
            >
              {current.title}
            </motion.p>
          </SurfaceCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
