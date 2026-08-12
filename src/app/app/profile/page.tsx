"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  Download,
  LineChart,
  Loader2,
  Moon,
  Trash2,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";

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
import { PLAN_LABEL, planLimits, resolvePlan } from "@/lib/plan";
import { cn } from "@/lib/utils";

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
  const [unlockToken, setUnlockToken] = useState("");
  const [planError, setPlanError] = useState<string | null>(null);
  const [planPending, startPlanTransition] = useTransition();
  const [prefsPending, startPrefsTransition] = useTransition();
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const setPlan = useMutation(api.users.setPlan);
  const updatePrefs = useMutation(api.users.updateNotificationPrefs);

  const planId = resolvePlan(user?.plan);
  const limits = planLimits(user?.plan);

  useEffect(() => {
    setFeedbackMuted(readFeedbackMuted());
  }, []);

  useEffect(() => {
    setQuietStart(user?.quietHoursStart ?? "22:00");
    setQuietEnd(user?.quietHoursEnd ?? "07:00");
  }, [user?.quietHoursStart, user?.quietHoursEnd]);

  function savePrefs(
    patch: Parameters<typeof updatePrefs>[0],
    options?: { syncTimes?: boolean }
  ) {
    setPrefsError(null);
    startPrefsTransition(async () => {
      try {
        await updatePrefs({
          ...patch,
          ...(options?.syncTimes
            ? { quietHoursStart: quietStart, quietHoursEnd: quietEnd }
            : {}),
        });
      } catch (err) {
        setPrefsError(
          err instanceof Error ? err.message : "Could not update preferences"
        );
      }
    });
  }

  function toggleFeedbackMute() {
    const next = !feedbackMuted;
    writeFeedbackMuted(next);
    setFeedbackMuted(next);
  }

  function unlockPremium() {
    setPlanError(null);
    startPlanTransition(async () => {
      try {
        await setPlan({
          plan: "premium",
          unlockToken: unlockToken.trim() || undefined,
        });
        setUnlockToken("");
      } catch (err) {
        setPlanError(
          err instanceof Error ? err.message : "Could not update plan"
        );
      }
    });
  }

  function downgradeFree() {
    setPlanError(null);
    startPlanTransition(async () => {
      try {
        await setPlan({ plan: "free" });
      } catch (err) {
        setPlanError(
          err instanceof Error ? err.message : "Could not update plan"
        );
      }
    });
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void signOut()}
            className="mt-3"
          >
            Sign out
          </Button>
        ) : (
          <Button asChild size="default" className="mt-4">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        )}
      </SurfaceCard>

      {isAuthenticated ? (
        <SurfaceCard tone="ink" className="mt-4 border border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
                Plan
              </p>
              <p className="mt-1 font-heading text-2xl font-bold">
                {PLAN_LABEL[planId]}
              </p>
              <p className="mt-1 text-xs text-white/55">
                Circles up to {limits.maxCircleMembers} · focus{" "}
                {limits.focusMinutesMax}m
                {limits.calendarExport ? " · calendar export" : ""}
              </p>
            </div>
          </div>
          {planId === "free" ? (
            <div className="mt-4 space-y-2">
              <Input
                value={unlockToken}
                onChange={(e) => setUnlockToken(e.target.value)}
                placeholder="Premium unlock token"
                className="h-11 rounded-2xl border-white/15 bg-white/5 text-white"
              />
              <Button
                type="button"
                variant="soft"
                disabled={planPending}
                onClick={() => void unlockPremium()}
                className="w-full"
              >
                {planPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Unlock Premium
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={planPending}
              onClick={() => void downgradeFree()}
              className="mt-4 w-full"
            >
              Switch to Free
            </Button>
          )}
          {planError ? (
            <p className="mt-2 text-xs text-coral-400">{planError}</p>
          ) : null}
        </SurfaceCard>
      ) : null}

      {isAuthenticated ? (
        <SurfaceCard tone="ink" className="mt-4 border border-white/10">
          <div className="flex items-start gap-3">
            <Moon className="mt-0.5 size-4 shrink-0 text-white/55" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
                Notifications
              </p>
              <p className="mt-1 font-heading text-xl font-bold">
                Quiet hours & channels
              </p>
              <p className="mt-1 text-xs text-white/55">
                Pause push and email overnight. In-app alerts still arrive.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <PrefToggle
              label="Email notifications"
              checked={user?.emailNotifications !== false}
              disabled={prefsPending}
              onChange={(next) => savePrefs({ emailNotifications: next })}
            />
            <PrefToggle
              label="Push notifications"
              checked={user?.pushNotifications !== false}
              disabled={prefsPending}
              onChange={(next) => savePrefs({ pushNotifications: next })}
            />
            <PrefToggle
              label="Quiet hours"
              checked={Boolean(user?.quietHoursEnabled)}
              disabled={prefsPending}
              onChange={(next) =>
                savePrefs(
                  { quietHoursEnabled: next },
                  next ? { syncTimes: true } : undefined
                )
              }
            />
          </div>

          {user?.quietHoursEnabled ? (
            <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-white/55">
                  Starts
                  <Input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    onBlur={() =>
                      savePrefs({ quietHoursStart: quietStart || "22:00" })
                    }
                    className="mt-2 h-11 rounded-2xl border-white/15 bg-white/5 text-white"
                  />
                </label>
                <label className="block text-xs font-semibold text-white/55">
                  Ends
                  <Input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    onBlur={() =>
                      savePrefs({ quietHoursEnd: quietEnd || "07:00" })
                    }
                    className="mt-2 h-11 rounded-2xl border-white/15 bg-white/5 text-white"
                  />
                </label>
              </div>
              <PrefToggle
                label="Include weekends"
                checked={user?.quietHoursIncludeWeekends !== false}
                disabled={prefsPending}
                onChange={(next) =>
                  savePrefs({ quietHoursIncludeWeekends: next })
                }
              />
              <PrefToggle
                label="Allow urgent help alerts"
                checked={user?.quietHoursAllowUrgent !== false}
                disabled={prefsPending}
                onChange={(next) =>
                  savePrefs({ quietHoursAllowUrgent: next })
                }
              />
            </div>
          ) : null}

          {prefsError ? (
            <p className="mt-2 text-xs text-coral-400">{prefsError}</p>
          ) : null}
        </SurfaceCard>
      ) : null}

      {isAuthenticated ? (
        <section className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Partners
            </h2>
            <Users className="size-4 text-white/65" />
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
                  variant="soft"
                  className="mt-3"
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
                        <AvatarFallback className="bg-signal text-xs font-semibold text-ink-950">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {partner.displayName}
                        </p>
                        <p className="truncate text-xs text-white/65">
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
          <Link href="/app/insights">
            <LineChart className="size-4" />
            Insights
          </Link>
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
          <Link href="/privacy?from=/app/profile">Privacy</Link>
        </Button>
        <Button
          asChild
          className="h-12 justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <Link href="/terms?from=/app/profile">Terms</Link>
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
            variant="destructive"
            size="lg"
            className="mt-3 w-full"
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

function PrefToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
        checked
          ? "border-signal/40 bg-signal/10 text-white"
          : "border-white/10 bg-white/5 text-white/75 hover:bg-white/8",
        disabled && "opacity-60"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "text-[11px] font-semibold tracking-wide uppercase",
          checked ? "text-signal" : "text-white/45"
        )}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}
