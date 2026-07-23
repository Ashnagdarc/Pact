"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Bell, Download, Loader2, Trash2, Users, Volume2, VolumeX } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PushOptInButton } from "@/components/pwa/push-opt-in-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useCurrentUser } from "@/hooks/use-demo-user";
import {
  readFeedbackMuted,
  writeFeedbackMuted,
} from "@/lib/feedback-prefs";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, signOut } = useCurrentUser();
  const partners = useQuery(
    api.pacts.listPartners,
    isAuthenticated ? {} : "skip"
  );
  const pushSubs = useQuery(
    api.pushSubscriptions.listMine,
    isAuthenticated ? {} : "skip"
  );
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedbackMuted, setFeedbackMuted] = useState(false);

  useEffect(() => {
    setFeedbackMuted(readFeedbackMuted());
  }, []);

  function toggleFeedbackMute() {
    const next = !feedbackMuted;
    writeFeedbackMuted(next);
    setFeedbackMuted(next);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  async function onDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const trimmed = password.trim();
      if (!trimmed) {
        throw new Error("Enter your password to delete this account.");
      }

      // B6: Auth delete runs first; Convex cascade happens in beforeDelete.
      const result = await authClient.deleteUser({
        password: trimmed,
        callbackURL: "/sign-in",
      });
      if (result.error) {
        throw new Error(result.error.message ?? "Could not delete account");
      }

      await signOut();
      router.replace("/sign-in");
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete account"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        You
      </h1>
      <p className="mt-2 text-sm text-white/70">
        Profile, partners, alerts, and install settings.
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

      {isAuthenticated ? (
        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Partners
            </h2>
            <Users className="size-4 text-white/45" />
          </div>
          <SurfaceCard tone="ink" className="border border-white/10">
            {partners === undefined ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-volt-500" />
              </div>
            ) : partners.length === 0 ? (
              <div>
                <p className="text-sm text-white/65">
                  No partners yet. Create a Pact and share the invite link.
                </p>
                <Button
                  asChild
                  className="mt-3 rounded-full bg-signal text-white"
                >
                  <Link href="/app/pacts/new">Create Pact</Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {partners.map((partner) => {
                  const initials = partner.displayName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <li
                      key={partner.userId}
                      className="flex items-center gap-3"
                    >
                      <Avatar className="size-10 border-2 border-ink-950">
                        {partner.avatarUrl ? (
                          <AvatarImage
                            src={partner.avatarUrl}
                            alt={partner.displayName}
                          />
                        ) : null}
                        <AvatarFallback className="bg-signal text-xs font-semibold text-white">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {partner.displayName}
                        </p>
                        <p className="truncate text-xs text-white/45">
                          {partner.pactTitles.join(" · ")}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SurfaceCard>
        </section>
      ) : null}

      <div className="mt-4 grid gap-3">
        {isAuthenticated ? (
          <PushOptInButton hasSubscription={(pushSubs?.length ?? 0) > 0} />
        ) : null}
        <Button
          type="button"
          onClick={toggleFeedbackMute}
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          {feedbackMuted ? (
            <VolumeX className="size-4" />
          ) : (
            <Volume2 className="size-4" />
          )}
          {feedbackMuted ? "Unmute sounds & haptics" : "Mute sounds & haptics"}
        </Button>
        <Button
          asChild
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/app/notifications">
            <Bell className="size-4" />
            Notification centre
          </Link>
        </Button>
        <Button
          asChild
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/app/install">
            <Download className="size-4" />
            Install guide
          </Link>
        </Button>
        <Button
          asChild
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/privacy">Privacy</Link>
        </Button>
        <Button
          asChild
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/terms">Terms</Link>
        </Button>
      </div>

      <InstallPrompt className="mt-4" />

      {isAuthenticated ? (
        <SurfaceCard tone="ink" className="mt-6 border border-coral-400/30">
          <p className="font-heading text-xl font-bold text-coral-400">
            Delete account
          </p>
          <p className="mt-2 text-sm text-white/55">
            Permanently removes your Pact data and auth account. Owned pacts and
            commitments are deleted. Enter your password to confirm.
          </p>
          <label className="mt-4 block text-xs font-semibold text-white/55">
            Confirm with your password
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              className="mt-2 h-11 rounded-2xl border-white/15 bg-white/5 text-white"
            />
          </label>
          <Button
            type="button"
            disabled={deleting || !password.trim()}
            onClick={() => void onDeleteAccount()}
            className="mt-3 h-11 w-full rounded-full bg-coral-400 text-ink-950 hover:bg-coral-400/90"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete my account
          </Button>
          {deleteError ? (
            <p className="mt-2 text-xs text-coral-400">{deleteError}</p>
          ) : null}
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
