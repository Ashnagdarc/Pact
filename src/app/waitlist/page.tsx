"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { AppShell } from "@/components/navigation/app-shell";
import { WaitlistComingSoon } from "@/components/screens/waitlist-coming-soon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readWaitlistEmail, writeWaitlistEmail } from "@/lib/launch";

export default function WaitlistPage() {
  const join = useMutation(api.waitlist.join);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinedEmail, setJoinedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setJoinedEmail(readWaitlistEmail());
    setHydrated(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await join({
        email,
        name: name.trim() || undefined,
        source: "waitlist",
      });
      const normalized = email.trim().toLowerCase();
      writeWaitlistEmail(normalized);
      setJoinedEmail(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join waitlist");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell showTabs={false} variant="hero">
      <div className="relative mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-md flex-col justify-center px-1 py-8">
        <p className="font-heading text-5xl font-extrabold tracking-tight text-volt-500">
          Pact
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Join the private beta
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Closed beta is open for accountability pairs. Request a slot here, or
          start now if you already have a partner ready.
        </p>
        <Button
          asChild
          variant="outline"
          className="mt-4 h-11 rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/sign-in?mode=sign-up">Start with a partner now</Link>
        </Button>

        {!hydrated ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="size-6 animate-spin text-volt-500" />
          </div>
        ) : joinedEmail ? (
          <WaitlistComingSoon email={joinedEmail} />
        ) : (
          <form onSubmit={onSubmit} className="mt-8 grid gap-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional)"
              className="h-12 rounded-2xl border-white/10 bg-white/5"
            />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="h-12 rounded-2xl border-white/10 bg-white/5"
            />
            {error ? (
              <p className="text-sm text-coral-400" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={busy}
              className="h-12 rounded-full bg-volt-500 font-semibold text-ink-950 hover:bg-volt-500/90"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Request invite"
              )}
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-11 rounded-full text-white/55 hover:text-white"
            >
              <Link href="/sign-in">Already invited? Sign in</Link>
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
