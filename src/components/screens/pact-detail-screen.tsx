"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Plus, RefreshCw, UserPlus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CommitmentCard } from "@/components/cards/commitment-card";
import { SurfaceCard } from "@/components/cards/surface-card";
import { HealthContributorBars } from "@/components/health/health-contributor-bars";
import { PactHealthRing } from "@/components/health/pact-health-ring";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusChip } from "@/components/feedback/status-chip";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { InviteShareCard } from "@/components/screens/invite-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import {
  pactHealthLabel,
  pactHealthTone,
} from "@/lib/pact-health-ui";
import {
  canAddCircleMember,
  planLimits,
  PLAN_LABEL,
  resolvePlan,
} from "@/lib/plan";
import type { CommitmentStatus } from "@/lib/status";
import {
  frequencyLabel,
  privacyHint,
  privacyLabel,
  styleLabel,
} from "@/lib/validation/pact";
import { cn } from "@/lib/utils";

type PactDetailScreenProps = {
  pactId: string;
};

function toUiStatus(status: string): CommitmentStatus | undefined {
  switch (status) {
    case "done":
    case "on_track":
    case "slipping":
    case "blocked":
    case "need_help":
    case "paused":
      return status;
    case "open":
      return "on_track";
    case "missed":
      return "slipping";
    default:
      return undefined;
  }
}

function roleLabel(role: string) {
  switch (role) {
    case "owner":
      return "Owner";
    case "partner":
      return "Partner";
    case "observer":
      return "Observer";
    default:
      return role;
  }
}

export function PactDetailScreen({ pactId }: PactDetailScreenProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <PactDetailConnected pactId={pactId} />;
}

function PactDetailConnected({ pactId }: PactDetailScreenProps) {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const { userId, user, loading: userLoading } = useCurrentUser();
  const detail = useQuery(
    api.pacts.getById,
    userId ? { pactId: pactId as Id<"pacts"> } : "skip"
  );
  const health = useQuery(
    api.health.forPact,
    userId ? { pactId: pactId as Id<"pacts"> } : "skip"
  );
  const createInvite = useMutation(api.pacts.createInvite);
  const ensureInvite = useMutation(api.pacts.ensureInvite);
  const updateSettings = useMutation(api.pacts.updateSettings);
  const setPactStatus = useMutation(api.pacts.setStatus);
  const refreshHealth = useMutation(api.health.refresh);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [ensured, setEnsured] = useState(false);
  // Expand invite after create, or when the owner taps Share.
  const [inviteExpanded, setInviteExpanded] = useState(justCreated);

  const isOwner =
    detail && !detail.forbidden && detail.membership
      ? detail.membership.role === "owner"
      : false;

  useEffect(() => {
    if (!userId || !detail || detail.forbidden || !detail.pact || !isOwner) {
      return;
    }
    if (ensured) return;
    if (inviteToken || detail.inviteToken) {
      setEnsured(true);
      return;
    }
    const accepted = detail.members.filter(
      (m) => m?.membership.invitationStatus === "accepted"
    ).length;
    if (!canAddCircleMember(user?.plan, accepted)) {
      setEnsured(true);
      return;
    }
    let cancelled = false;
    void ensureInvite({ pactId: detail.pact._id })
      .then((token) => {
        if (!cancelled) {
          setInviteToken(token);
          setEnsured(true);
        }
      })
      .catch(() => {
        if (!cancelled) setEnsured(true);
      });
    return () => {
      cancelled = true;
    };
  }, [
    detail,
    ensureInvite,
    ensured,
    inviteToken,
    isOwner,
    user?.plan,
    userId,
  ]);

  if (userLoading || detail === undefined || health === undefined) {
    return (
      <AppShell>
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  if (!detail || detail.forbidden || !detail.pact) {
    return (
      <AppShell>
        <SurfaceCard tone="coral" className="mt-8">
          <p className="font-heading text-2xl font-bold">Pact unavailable</p>
          <p className="mt-2 text-sm opacity-80">
            Accept an invite first, or ask the owner to share a new link.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/app/pacts">Back to Pacts</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  const { pact, membership, members, commitments } = detail;
  const activeToken = inviteToken ?? detail.inviteToken;
  const healthStatus = health?.status ?? pact.healthStatus;
  const acceptedMembers = members.filter(
    (m) => m?.membership.invitationStatus === "accepted"
  );
  const maxMembers = planLimits(user?.plan).maxCircleMembers;
  const circleFull = !canAddCircleMember(user?.plan, acceptedMembers.length);
  const planName = PLAN_LABEL[resolvePlan(user?.plan)];

  function refreshInvite() {
    if (!userId || circleFull) return;
    setInviteError(null);
    startTransition(async () => {
      try {
        const token = await createInvite({
          pactId: pact._id,
        });
        setInviteToken(token);
        await refreshHealth({ pactId: pact._id });
      } catch (err) {
        setInviteError(
          err instanceof Error ? err.message : "Could not create invite"
        );
      }
    });
  }

  return (
    <AppShell>
      <header className="mb-4 flex items-center justify-between pt-2">
        <Button
          asChild
          size="icon-lg"
          variant="outline"
          aria-label="Back"
        >
          <Link href="/app/pacts">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <span className="text-xs font-semibold tracking-wide text-white/45 uppercase">
          Pact
        </span>
        <span className="size-11" aria-hidden />
      </header>

      <SurfaceCard
        tone="ink"
        padding="lg"
        className="rounded-[2rem] border border-white/10"
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-6">
          <PactHealthRing status={healthStatus} size={156} />
          <div className="min-w-0 flex-1 text-center sm:pt-2 sm:text-left">
            <StatusChip
              label={pactHealthLabel[healthStatus]}
              tone={pactHealthTone[healthStatus]}
              className="mb-3 capitalize"
            />
            <h1 className="font-heading text-3xl leading-none font-extrabold tracking-tight sm:text-4xl">
              {pact.title}
            </h1>
            {pact.description ? (
              <p className="mt-3 text-sm font-medium text-white/70">
                {pact.description}
              </p>
            ) : null}
            <div className="mt-4 text-xs font-semibold text-white/55">
              <p>
                {pact.accountabilityStyle
                  ? styleLabel[
                      pact.accountabilityStyle as keyof typeof styleLabel
                    ]
                  : "Supportive"}
                {" · "}
                {pact.checkInFrequency
                  ? frequencyLabel[
                      pact.checkInFrequency as keyof typeof frequencyLabel
                    ]
                  : "Daily"}{" "}
                check-ins
              </p>
            </div>
          </div>
        </div>

        {health?.metrics ? (
          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-white/45 uppercase">
              Why this status
            </p>
            <HealthContributorBars
              metrics={health.metrics}
              reasons={health.reasons}
            />
          </div>
        ) : health?.reasons?.length ? (
          <ul className="mt-5 space-y-1.5 rounded-[1.25rem] bg-white/5 p-3">
            {health.reasons.slice(0, 4).map((reason) => (
              <li key={reason.code} className="text-sm font-medium text-white/80">
                · {reason.label}
              </li>
            ))}
          </ul>
        ) : null}

        {isOwner &&
        (pact.status === "active" ||
          pact.status === "paused" ||
          pact.status === "draft") ? (
          <div className="mt-5 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant={pact.status === "paused" ? "soft" : "outline"}
              size="lg"
              disabled={isPending}
              className="w-full"
              onClick={() =>
                startTransition(async () => {
                  await setPactStatus({
                    pactId: pact._id,
                    status: pact.status === "paused" ? "active" : "paused",
                  });
                  await refreshHealth({ pactId: pact._id });
                })
              }
            >
              {pact.status === "paused" ? "Restart Pact" : "Pause Pact"}
            </Button>
            <p className="mt-2 text-center text-[11px] text-white/45">
              {pact.status === "paused"
                ? "Restarting resumes reminders and health tracking."
                : "Pausing stops reminders and freezes Pact Health."}
            </p>
          </div>
        ) : null}
      </SurfaceCard>

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Commitments
          </h2>
          <span className="text-xs font-semibold text-white/65">
            {commitments.length}
          </span>
        </div>

        {commitments.length === 0 ? (
          <SurfaceCard tone="ink" padding="lg" className="border border-white/10">
            <p className="font-heading text-xl font-bold tracking-tight">
              This Pact has no commitments yet
            </p>
            <p className="mt-2 text-sm text-white/65">
              Add the first one so partners know what you are holding each other
              to. Use the + button below when you&apos;re ready.
            </p>
            <Button
              asChild
              variant="soft"
              size="lg"
              className="mt-5 w-full"
            >
              <Link href={`/app/new?pactId=${pact._id}`}>
                <Plus className="size-4" />
                Add commitment
              </Link>
            </Button>
          </SurfaceCard>
        ) : (
          <div className="space-y-3">
            {commitments.map((commitment) => (
              <CommitmentCard
                key={commitment._id}
                title={commitment.title}
                tone={commitment.tone ?? "cream"}
                status={toUiStatus(commitment.status)}
                meta={
                  commitment.dueAt
                    ? `Due ${format(commitment.dueAt, "MMM d")}`
                    : undefined
                }
                href={`/app/commitments/${commitment._id}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Partners
          </h2>
          <span className="text-xs font-semibold text-white/65">
            {acceptedMembers.length}
          </span>
        </div>

        <SurfaceCard tone="ink" className="border border-white/10">
          <ul className="space-y-3">
            {acceptedMembers.map((entry) => {
              if (!entry) return null;
              const name = entry.user.displayName;
              const initials = name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <li
                  key={entry.user._id}
                  className="flex items-center gap-3"
                >
                  <Avatar className="size-10 border-2 border-ink-950">
                    {entry.user.avatarUrl ? (
                      <AvatarImage src={entry.user.avatarUrl} alt={name} />
                    ) : null}
                    <AvatarFallback className="bg-signal text-xs font-semibold text-ink-950">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {entry.user._id === userId ? `${name} (you)` : name}
                    </p>
                    <p className="text-xs text-white/65">
                      {roleLabel(entry.membership.role)}
                    </p>
                  </div>
                  <StatusChip
                    label={roleLabel(entry.membership.role)}
                    tone={
                      entry.membership.role === "owner" ? "volt" : "muted"
                    }
                  />
                </li>
              );
            })}
          </ul>

          {acceptedMembers.length <= 1 ? (
            <p className="mt-4 rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/60">
              {isOwner
                ? "You’re the only one here. Invite a partner when you’re ready."
                : "Waiting for more partners to join."}
            </p>
          ) : null}
        </SurfaceCard>
      </section>

      {isOwner ? (
        <section id="invite" className="mt-8 scroll-mt-24 space-y-3">
          {circleFull ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="text-sm font-semibold">Circle is full</p>
              <p className="mt-1 text-xs text-white/55">
                {acceptedMembers.length}/{maxMembers} members on {planName}. Premium
                unlocks up to 12.
              </p>
              <Button asChild variant="soft" size="default" className="mt-3">
                <Link href="/app/profile">View plan</Link>
              </Button>
            </SurfaceCard>
          ) : !inviteExpanded ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <UserPlus className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Invite a partner</p>
                  <p className="mt-0.5 text-xs text-white/55">
                    Circle {acceptedMembers.length}/{maxMembers} · share a link when
                    ready.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setInviteExpanded(true)}
                  variant="soft"
                  size="default"
                  className="shrink-0 px-4"
                >
                  Share
                </Button>
              </div>
            </SurfaceCard>
          ) : (
            <>
              <div className="mb-1 flex items-end justify-between">
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  Invite
                </h2>
                <button
                  type="button"
                  onClick={() => setInviteExpanded(false)}
                  className="text-xs font-semibold text-white/55 hover:text-white/80"
                >
                  Hide
                </button>
              </div>

              <p className="text-xs text-white/55">
                Circle {acceptedMembers.length}/{maxMembers} ({planName})
              </p>

              {activeToken ? (
                <InviteShareCard
                  token={activeToken}
                  autoFocus={justCreated}
                  pactTitle={detail.pact.title}
                />
              ) : (
                <SurfaceCard tone="ink" className="border border-white/10">
                  <p className="text-sm text-white/70">
                    Generating your invite link…
                  </p>
                </SurfaceCard>
              )}

              <Button
                type="button"
                disabled={isPending}
                onClick={refreshInvite}
                variant="outline"
                size="lg"
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {activeToken ? "Refresh invite link" : "Create invite link"}
              </Button>
              {inviteError ? (
                <p className="text-xs text-coral-400">{inviteError}</p>
              ) : null}

              <SurfaceCard tone="ink" className="border border-white/10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/65">
                  Privacy
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    Object.keys(privacyLabel) as Array<
                      keyof typeof privacyLabel
                    >
                  ).map((level) => (
                    <button
                      key={level}
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await updateSettings({
                            pactId: pact._id,
                            privacyLevel: level,
                          });
                        })
                      }
                      className={cn(
                        "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                        pact.privacyLevel === level
                          ? "border-volt-500 bg-volt-500 text-white"
                          : "border-white/15 text-white/70"
                      )}
                    >
                      {privacyLabel[level]}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/65">
                  {privacyHint[pact.privacyLevel as keyof typeof privacyHint]}
                </p>
              </SurfaceCard>
            </>
          )}
        </section>
      ) : (
        <SurfaceCard tone="ink" className="mt-5 border border-white/10">
          <p className="text-sm text-white/65">
            Only the owner can invite more partners. Ask them to share the
            invite link.
          </p>
        </SurfaceCard>
      )}

    </AppShell>
  );
}
