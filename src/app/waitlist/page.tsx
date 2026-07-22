"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { ArrowRight, Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { AppShell } from "@/components/navigation/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WaitlistPage() {
  const join = useMutation(api.waitlist.join);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setDone(true);
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
          Test structured accountability with someone you trust. We&apos;ll
          invite you as slots open.
        </p>

        {done ? (
          <div className="mt-8 rounded-3xl border border-volt-500/25 bg-volt-500/10 p-5">
            <p className="font-semibold text-volt-500">You&apos;re on the list</p>
            <p className="mt-2 text-sm text-white/65">
              Watch {email} for an invite. Bring a partner when you join.
            </p>
            <Button asChild className="mt-5 h-11 rounded-full bg-volt-500 text-ink-950">
              <Link href="/sign-in">
                Already invited? Sign in
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
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
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Request invite"}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
