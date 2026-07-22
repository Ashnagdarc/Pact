"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import {
  getCountdownParts,
  getLaunchTimeline,
  LAUNCH_AT,
  type CountdownParts,
} from "@/lib/launch";
import { cn } from "@/lib/utils";

type TabId = "timer" | "timeline";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CountdownGrid({ parts }: { parts: CountdownParts }) {
  if (parts.launched) {
    return (
      <div className="rounded-3xl border border-volt-500/25 bg-volt-500/10 px-5 py-6 text-center">
        <p className="font-heading text-2xl font-bold text-volt-500">
          Pact is live
        </p>
        <p className="mt-2 text-sm text-white/60">
          Your invite window is open — sign in when you&apos;re ready.
        </p>
      </div>
    );
  }

  const cells = [
    { label: "Days", value: parts.days },
    { label: "Hours", value: parts.hours },
    { label: "Min", value: parts.minutes },
    { label: "Sec", value: parts.seconds },
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4 text-center"
        >
          <p className="font-heading text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
            {pad(cell.value)}
          </p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-white/40 uppercase">
            {cell.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function WaitlistComingSoon({ email }: { email: string }) {
  const [tab, setTab] = useState<TabId>("timer");
  const [parts, setParts] = useState<CountdownParts>(() => getCountdownParts());
  const timeline = getLaunchTimeline();

  useEffect(() => {
    const tick = () => setParts(getCountdownParts());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const launchLabel = LAUNCH_AT.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mt-8">
      <div className="rounded-3xl border border-volt-500/25 bg-volt-500/10 p-5">
        <p className="font-semibold text-volt-500">You&apos;re on the list</p>
        <p className="mt-2 text-sm text-white/65">
          We&apos;ll email <span className="text-white/85">{email}</span> as
          more slots open. Closed beta is live now — start with a partner if
          you&apos;re ready.
        </p>
      </div>

      <div className="mt-5 flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {(
          [
            { id: "timer", label: "Timer" },
            { id: "timeline", label: "Timeline" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
              tab === item.id
                ? "bg-volt-500 text-ink-950"
                : "text-white/50 hover:text-white/80"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5"
      >
        {tab === "timer" ? (
          <div className="grid gap-3">
            <p className="text-sm text-white/55">
              Launch target · {launchLabel}
            </p>
            <CountdownGrid parts={parts} />
          </div>
        ) : (
          <ol className="grid gap-3">
            {timeline.map((item, index) => (
              <li
                key={item.id}
                className="relative flex gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-3"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    item.status === "done" && "bg-mint-300/20 text-mint-300",
                    item.status === "current" && "bg-volt-500/20 text-volt-500",
                    item.status === "upcoming" && "bg-white/5 text-white/35"
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                        item.status === "done" && "bg-mint-300/15 text-mint-300",
                        item.status === "current" &&
                          "bg-volt-500/15 text-volt-500",
                        item.status === "upcoming" &&
                          "bg-white/5 text-white/40"
                      )}
                    >
                      {item.status === "done"
                        ? "Done"
                        : item.status === "current"
                          ? "Now"
                          : "Next"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </motion.div>

      <Button
        asChild
        className="mt-6 h-11 w-full rounded-full bg-volt-500 text-ink-950 hover:bg-volt-500/90"
      >
        <Link href="/sign-in?mode=sign-up">
          Start with a partner now
          <ArrowRight className="size-4" />
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        className="mt-2 h-10 w-full rounded-full text-white/45 hover:text-white/75"
      >
        <Link href="/sign-in">Already have an account? Sign in</Link>
      </Button>
    </div>
  );
}
