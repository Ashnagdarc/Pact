"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  MessageCircleWarning,
  RefreshCw,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

type Tone = "mint" | "coral" | "volt" | "signal" | "cream";

type Task = {
  id: string;
  title: string;
  meta: string;
  tone: Tone;
};

type PopupKind = "updated" | "approved" | "rejected" | "help" | "rescue";

type Popup = {
  id: number;
  kind: PopupKind;
  title: string;
  detail: string;
};

const TASK_DECK: Task[] = [
  { id: "t1", title: "Morning mobility", meta: "On track", tone: "mint" },
  { id: "t2", title: "Ship landing page", meta: "Due today", tone: "coral" },
  { id: "t3", title: "Call Alex", meta: "Need help", tone: "signal" },
  { id: "t4", title: "Evening journal", meta: "Paused", tone: "cream" },
  { id: "t5", title: "Read 20 pages", meta: "Kept", tone: "volt" },
  { id: "t6", title: "Gym with Jordan", meta: "Check-in due", tone: "coral" },
  { id: "t7", title: "Draft portfolio", meta: "On track", tone: "mint" },
  { id: "t8", title: "Budget review", meta: "Blocked", tone: "signal" },
  { id: "t9", title: "Spanish lesson", meta: "Rescue plan", tone: "coral" },
  { id: "t10", title: "Ship beta invites", meta: "Partner ok", tone: "volt" },
];

const POPUP_SCRIPT: Omit<Popup, "id">[] = [
  {
    kind: "updated",
    title: "Check-in sent",
    detail: "Morning mobility · proof attached",
  },
  {
    kind: "approved",
    title: "Partner approved",
    detail: "Jordan · “Looks solid”",
  },
  {
    kind: "rejected",
    title: "Update rejected",
    detail: "Ship landing page · needs clearer proof",
  },
  {
    kind: "help",
    title: "Help requested",
    detail: "Call Alex · waiting on reply",
  },
  {
    kind: "rescue",
    title: "Rescue started",
    detail: "Spanish lesson · new deadline set",
  },
  {
    kind: "updated",
    title: "Status updated",
    detail: "Draft portfolio · on track",
  },
  {
    kind: "rejected",
    title: "Check-in declined",
    detail: "Gym with Jordan · redo tomorrow",
  },
  {
    kind: "approved",
    title: "Commitment kept",
    detail: "Read 20 pages · streak +1",
  },
];

const toneClass: Record<Tone, string> = {
  mint: "bg-mint-300 text-ink-950",
  coral: "bg-coral-400 text-ink-950",
  volt: "bg-volt-500 text-ink-950",
  signal: "bg-signal text-white",
  cream: "bg-cream-200 text-ink-950",
};

const popupStyle: Record<
  PopupKind,
  { wrap: string; Icon: typeof CheckCircle2 }
> = {
  updated: {
    wrap: "border-mint-300/40 bg-mint-300 text-ink-950",
    Icon: CheckCircle2,
  },
  approved: {
    wrap: "border-volt-500/40 bg-volt-500 text-ink-950",
    Icon: ThumbsUp,
  },
  rejected: {
    wrap: "border-coral-400/50 bg-coral-400 text-ink-950",
    Icon: XCircle,
  },
  help: {
    wrap: "border-signal/40 bg-signal text-white",
    Icon: MessageCircleWarning,
  },
  rescue: {
    wrap: "border-white/20 bg-ink-800 text-paper-100",
    Icon: RefreshCw,
  },
};

const VISIBLE = 3;
const TASK_CYCLE_MS = 5200;
const POPUP_CYCLE_MS = 6000;
const POPUP_VISIBLE_MS = 4000;
const FIRST_POPUP_MS = 1600;

/** Smooth decelerating ease — soft land, no snap. */
const easeSoft = [0.22, 1, 0.36, 1] as const;
const easeExit = [0.4, 0, 0.2, 1] as const;

function visibleSlice(start: number): Task[] {
  return Array.from({ length: VISIBLE }, (_, i) => {
    return TASK_DECK[(start + i) % TASK_DECK.length]!;
  });
}

export function LandingHeroDevice() {
  const [start, setStart] = useState(0);
  const [kept, setKept] = useState(12);
  const [popup, setPopup] = useState<Popup | null>(null);
  const reduceMotion = usePrefersReducedMotion();

  const visible = visibleSlice(start);

  useEffect(() => {
    if (reduceMotion) return;

    const taskTimer = window.setInterval(() => {
      setStart((prev) => (prev + 1) % TASK_DECK.length);
    }, TASK_CYCLE_MS);

    return () => window.clearInterval(taskTimer);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;

    let hideTimer: number | undefined;
    let step = 0;

    const showNext = () => {
      const script = POPUP_SCRIPT[step % POPUP_SCRIPT.length]!;
      step += 1;
      setPopup({ ...script, id: Date.now() + step });
      if (script.kind === "approved" || script.kind === "updated") {
        setKept((k) => k + 1);
      }
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setPopup(null), POPUP_VISIBLE_MS);
    };

    const first = window.setTimeout(showNext, FIRST_POPUP_MS);
    const showTimer = window.setInterval(showNext, POPUP_CYCLE_MS);

    return () => {
      window.clearInterval(showTimer);
      window.clearTimeout(first);
      window.clearTimeout(hideTimer);
    };
  }, [reduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 1, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[22rem]"
      aria-hidden
    >
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,_rgba(255,247,104,0.22),_transparent_65%)] blur-2xl" />

      {/* Floating status popups */}
      <div
        className="pointer-events-none absolute -top-2 right-0 left-0 z-30 flex justify-center px-3 sm:-right-6 sm:left-auto sm:justify-end"
        style={{ perspective: "900px" }}
      >
        <AnimatePresence mode="wait">
          {popup ? (
            <motion.div
              key={popup.id}
              initial={{
                opacity: 0,
                y: 16,
                scale: 0.94,
                rotateX: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
              }}
              exit={{
                opacity: 0,
                y: -10,
                scale: 0.96,
                rotateX: -6,
              }}
              transition={{
                duration: 0.7,
                ease: easeSoft,
                opacity: { duration: 0.55, ease: easeExit },
              }}
              className={cn(
                "flex max-w-[16.5rem] items-start gap-2.5 rounded-2xl border px-3 py-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.45)] [transform-style:preserve-3d]",
                popupStyle[popup.kind].wrap
              )}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: easeSoft, delay: 0.08 }}
                className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-black/10"
              >
                {(() => {
                  const Icon = popupStyle[popup.kind].Icon;
                  return <Icon className="size-4" strokeWidth={2.4} />;
                })()}
              </motion.span>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-bold tracking-wide uppercase opacity-70">
                  {popup.title}
                </p>
                <p className="mt-0.5 text-sm leading-snug font-semibold">
                  {popup.detail}
                </p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div
        className="relative overflow-hidden rounded-[2.4rem] border border-white/12 bg-ink-900 shadow-[0_40px_100px_rgba(0,0,0,0.55)]"
        style={{ perspective: "1000px" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-white/40 uppercase">
              Today
            </p>
            <p className="font-heading mt-1 text-2xl font-extrabold tracking-tight text-volt-500">
              Pact
            </p>
          </div>
          <motion.div
            key={kept}
            initial={reduceMotion ? false : { scale: 1.06, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.55, ease: easeSoft }}
            className="rounded-full bg-white/8 px-3 py-1 text-[0.65rem] font-semibold text-white/55"
          >
            {kept} kept
          </motion.div>
        </div>

        <div className="relative min-h-[15.5rem] space-y-2.5 px-4 pb-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 20,
                        scale: 0.97,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -14,
                  scale: 0.98,
                }}
                transition={{
                  layout: { duration: 0.65, ease: easeSoft },
                  opacity: { duration: 0.55, ease: easeExit },
                  y: { duration: 0.7, ease: easeSoft },
                  scale: { duration: 0.7, ease: easeSoft },
                  delay: index * 0.06,
                }}
                style={{ transformOrigin: "center top" }}
                className={cn(
                  "rounded-[1.35rem] px-4 py-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.22)]",
                  toneClass[item.tone]
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.65rem] font-bold tracking-[0.12em] uppercase opacity-65">
                      {item.meta}
                    </p>
                    <p className="font-heading mt-1 text-lg leading-tight font-bold tracking-tight">
                      {item.title}
                    </p>
                  </div>
                  <motion.span
                    animate={
                      reduceMotion
                        ? undefined
                        : { y: [0, -1.5, 0] }
                    }
                    transition={{
                      duration: 3.6,
                      repeat: Infinity,
                      delay: index * 0.35,
                      ease: "easeInOut",
                    }}
                    className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-black/10 text-[0.7rem] font-bold"
                  >
                    {index + 1}
                  </motion.span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
