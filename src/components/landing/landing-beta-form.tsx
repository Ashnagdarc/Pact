"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import {
  getCountdownParts,
  getLaunchTimeline,
  writeWaitlistEmail,
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
          Early beta is open
        </p>
        <p className="mt-2 text-sm text-white/70">
          Check your email for your one-time access code and link.
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
          <p className="font-heading text-2xl font-bold tracking-tight tabular-nums">
            {pad(cell.value)}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/65">
            {cell.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function JoinedPanel({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const [parts, setParts] = useState(() => getCountdownParts());
  const [tab, setTab] = useState<TabId>("timer");
  const timeline = getLaunchTimeline();

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setParts(getCountdownParts()), 1000);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) setParts(getCountdownParts());
  }, [reduceMotion]);

  return (
    <div className="mx-auto w-full max-w-md space-y-4 text-left">
      <div className="rounded-[1.75rem] border border-volt-500/25 bg-volt-500/10 px-5 py-6 sm:px-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-volt-500 text-white">
          <Check className="size-5" strokeWidth={2.5} />
        </div>
        <p className="font-heading mt-4 text-2xl font-bold tracking-tight">
          {name ? `You're in, ${name}` : "You're on the list"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          We emailed <span className="text-white/90">{email}</span>{" "}
          a welcome note with your personal access link and one-time code.
          Check your inbox (and spam). We don&apos;t show the code here.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-4 flex gap-2">
          {(
            [
              ["timer", "Countdown"],
              ["timeline", "Timeline"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === id
                  ? "bg-volt-500 text-white"
                  : "bg-white/5 text-white/65 hover:text-white/85",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "timer" ? (
          <CountdownGrid parts={parts} />
        ) : (
          <ol className="space-y-3">
            {timeline.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span
                  className={cn(
                    "mt-1 size-2.5 shrink-0 rounded-full",
                    item.status === "done" && "bg-volt-500",
                    item.status === "current" && "bg-signal",
                    item.status === "upcoming" && "bg-white/20",
                  )}
                />
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-white/65">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export function LandingBetaForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<{
    email: string;
    name?: string | null;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        ok?: boolean;
        email?: string;
        name?: string | null;
      } | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not join the waitlist");
      }

      const normalized = (payload.email || email).trim().toLowerCase();
      writeWaitlistEmail(normalized);
      setJoined({
        email: normalized,
        name: payload.name ?? (name.trim() || null),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the waitlist");
    } finally {
      setBusy(false);
    }
  }

  if (joined) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <JoinedPanel {...joined} />
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto grid w-full max-w-md gap-3 text-left"
    >
      <label className="grid gap-1.5 text-sm font-medium text-white/70">
        Name <span className="font-normal text-white/65">(optional)</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/35"
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-white/70">
        Email
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/35"
        />
      </label>
      {error ? (
        <p className="text-sm text-coral-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={busy}
        className="h-12 rounded-full bg-volt-500 px-6 text-base font-semibold text-white hover:bg-volt-500/90"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Join the waitlist"}
      </Button>
      <p className="text-center text-xs text-white/65">
        You&apos;ll get a welcome email with a one-time 6-digit code and personal
        link to open the early beta.
      </p>
    </form>
  );
}
