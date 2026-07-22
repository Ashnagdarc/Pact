"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const POST_ONBOARDING_PATH_KEY = "pact.postOnboardingPath";

function initialMode(searchParams: URLSearchParams): "sign-in" | "sign-up" {
  return searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
}

function safeInternalPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

function savePostOnboardingPath(path: string) {
  if (
    typeof window === "undefined" ||
    path === "/" ||
    path === "/app"
  ) {
    return;
  }
  try {
    window.sessionStorage.setItem(POST_ONBOARDING_PATH_KEY, path);
  } catch {
    // Navigation still works without storage; the user will land on the dashboard.
  }
}

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalPath(searchParams.get("next"));
  const fromBetaLink = searchParams.get("beta") === "1";
  const [mode, setMode] = useState<"sign-in" | "sign-up">(() =>
    initialMode(searchParams)
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureBetaAccess() {
    // Link redeem already set the httpOnly cookie.
    if (fromBetaLink) return;
    const code = inviteCode.trim();
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Enter the 6-digit code from your welcome email");
    }
    const response = await fetch("/api/beta/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (!response.ok) {
      throw new Error(payload?.error || "Invalid or used invite code");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "sign-up") {
        await ensureBetaAccess();

        const result = await authClient.signUp.email({
          name: name.trim() || email.split("@")[0] || "Pact user",
          email,
          password,
        });
        if (result.error) {
          throw new Error(result.error.message || "Sign up failed");
        }

        // Best-effort cookie clear after Better Auth consumed the invite.
        void fetch("/api/beta/consume", { method: "POST" }).catch(() => null);

        savePostOnboardingPath(nextPath);
        router.replace("/app/onboarding");
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });
        if (result.error) {
          throw new Error(result.error.message || "Sign in failed");
        }

        router.replace(nextPath);
      }
      router.refresh();
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
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-white/55">
          {mode === "sign-up"
            ? fromBetaLink
              ? "Your invite link is unlocked. Create your account to open the early beta."
              : "Early beta is invite-only. Use the 6-digit code from your welcome email."
            : "Sign in to keep commitments with people who keep you honest."}
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-3">
          {mode === "sign-up" ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
              autoComplete="name"
              className="h-12 rounded-2xl border-white/10 bg-white/5"
            />
          ) : null}
          {mode === "sign-up" && !fromBetaLink ? (
            <Input
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={inviteCode}
              onChange={(e) =>
                setInviteCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit invite code"
              autoComplete="one-time-code"
              className="h-12 rounded-2xl border-white/10 bg-white/5 tracking-[0.35em]"
            />
          ) : null}
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="h-12 rounded-2xl border-white/10 bg-white/5"
          />
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 8 chars)"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            className="h-12 rounded-2xl border-white/10 bg-white/5"
          />

          {mode === "sign-in" ? (
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-white/50 underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          ) : null}

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
            ) : mode === "sign-in" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <button
          type="button"
          className="mt-5 text-sm text-white/60 underline-offset-2 hover:underline"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError(null);
          }}
        >
          {mode === "sign-in"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>

        {mode === "sign-up" ? (
          <Link
            href="/#waitlist"
            className="mt-4 text-center text-xs text-white/40 underline-offset-2 hover:underline"
          >
            Don&apos;t have a code? Join the waitlist
          </Link>
        ) : null}

        <Link
          href="/"
          className="mt-6 text-center text-xs text-white/40 underline-offset-2 hover:underline"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
