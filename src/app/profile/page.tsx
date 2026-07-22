"use client";

import Link from "next/link";
import { Bell, Download, Loader2 } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PushOptInButton } from "@/components/pwa/push-opt-in-button";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";

export default function ProfilePage() {
  const { user, loading, isAuthenticated, signOut } = useCurrentUser();

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        You
      </h1>
      <p className="mt-2 text-sm text-white/55">
        Profile, alerts, and install settings.
      </p>

      <SurfaceCard tone="cream" className="mt-6">
        <p className="font-heading text-2xl font-bold">
          {user?.displayName ?? "Guest"}
        </p>
        <p className="mt-1 text-sm opacity-70">
          {isAuthenticated
            ? (user?.email ?? "Signed in with Better Auth")
            : "Not signed in"}
        </p>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-3 text-xs font-semibold underline-offset-2 hover:underline"
          >
            Sign out
          </button>
        ) : (
          <Button asChild className="mt-4 rounded-full">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        )}
      </SurfaceCard>

      <div className="mt-4 grid gap-3">
        {isAuthenticated ? <PushOptInButton /> : null}
        <Button
          asChild
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/notifications">
            <Bell className="size-4" />
            Notification centre
          </Link>
        </Button>
        <Button
          asChild
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/install">
            <Download className="size-4" />
            Install guide
          </Link>
        </Button>
      </div>

      <InstallPrompt className="mt-4" />
    </AppShell>
  );
}
