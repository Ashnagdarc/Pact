"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "INVALID_TOKEN" ? "This reset link is invalid or expired." : null
  );
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token. Request a new link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (result.error) {
        throw new Error(result.error.message || "Could not reset password");
      }
      setDone(true);
      window.setTimeout(() => {
        router.push("/sign-in");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="content" className="relative min-h-dvh overflow-hidden bg-ink-950 text-paper-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,82,38,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(88,140,255,0.16),_transparent_50%)]"
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <p className="font-heading text-5xl font-extrabold tracking-tight text-volt-500">
          Pact
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Choose a new password for your account.
        </p>

        {done ? (
          <div className="mt-8 rounded-3xl border border-volt-500/25 bg-volt-500/10 p-5">
            <p className="font-semibold text-volt-500">Password updated</p>
            <p className="mt-2 text-sm text-white/65">
              Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-white/70">
              New password
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="h-12 rounded-2xl border-white/10 bg-white/5"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-white/70">
              Confirm password
              <Input
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
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
              disabled={busy || !token}
              className="h-12 rounded-full bg-volt-500 font-semibold text-white hover:bg-volt-500/90"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        )}

        <Link
          href="/forgot-password"
          className="mt-6 text-center text-sm text-white/50 underline-offset-2 hover:underline"
        >
          Request a new reset link
        </Link>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-ink-950 text-white/60">
          Loading…
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
