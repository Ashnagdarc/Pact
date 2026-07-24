"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        throw new Error(result.error.message || "Could not send reset email");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ink-950 text-paper-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(201,255,74,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(88,140,255,0.16),_transparent_50%)]"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <p className="font-heading text-5xl font-extrabold tracking-tight text-volt-500">
          Pact
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Enter your email and we&apos;ll send a reset link if an account
          exists.
        </p>

        {sent ? (
          <div className="mt-8 rounded-3xl border border-volt-500/25 bg-volt-500/10 p-5">
            <p className="font-semibold text-volt-500">Check your email</p>
            <p className="mt-2 text-sm text-white/65">
              If {email} is registered, a reset link is on the way. It expires
              in about an hour. Check spam if you don&apos;t see it.
            </p>
            <Button
              asChild
              className="mt-5 h-11 rounded-full bg-volt-500 text-white"
            >
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-white/70">
              Email
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-12 rounded-2xl border-white/10 bg-white/5"
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
              className="h-12 rounded-full bg-volt-500 font-semibold text-white hover:bg-volt-500/90"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        )}

        <Link
          href="/sign-in"
          className="mt-6 text-center text-sm text-white/50 underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
