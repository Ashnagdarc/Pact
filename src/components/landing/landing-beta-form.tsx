"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LandingBetaForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

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
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Could not join the waitlist");
      }

      setJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join the waitlist");
    } finally {
      setBusy(false);
    }
  }

  if (joined) {
    return (
      <div className="mx-auto w-full max-w-md rounded-[1.75rem] border border-volt-500/25 bg-volt-500/10 px-5 py-6 text-left sm:px-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-volt-500 text-ink-950">
          <Check className="size-5" strokeWidth={2.5} />
        </div>
        <p className="font-heading mt-4 text-2xl font-bold tracking-tight">
          You&apos;re on the list
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          We saved <span className="text-white/85">{email.trim()}</span>. We&apos;ll
          email you when a private beta slot opens for you and a partner.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto grid w-full max-w-md gap-3 text-left"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (optional)"
        autoComplete="name"
        className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/35"
      />
      <Input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        autoComplete="email"
        className="h-12 rounded-2xl border-white/10 bg-white/5 px-4 text-base text-white placeholder:text-white/35"
      />
      {error ? (
        <p className="text-sm text-coral-400" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={busy}
        className="h-12 rounded-full bg-volt-500 px-6 text-base font-semibold text-ink-950 hover:bg-volt-500/90"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Join the waitlist"}
      </Button>
      <p className="text-center text-xs text-white/35">
        No spam. Invite-only beta for accountability pairs.
      </p>
    </form>
  );
}
