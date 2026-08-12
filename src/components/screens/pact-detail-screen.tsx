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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusChip } from "@/components/feedback/status-chip";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { InviteShareCard } from "@/components/screens/invite-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
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
  const { userId, loading: userLoading } = useCurrentUser();
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
  const refreshHealth = useMutation(api.health.refresh);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
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
    let cancelled = false;
    void ensureInvite({ pactId: detail.pact._id }).then((token) => {
      if (!cancelled) {
        setInviteToken(token);
        setEnsured(true);
      }
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

  function refreshInvite() {
    if (!userId) return;
    startTransition(async () => {
      const token = await createInvite({
        pactId: pact._id,
      });
      setInviteToken(token);
      await refreshHealth({ pactId: pact._id });
    });
  }

  return (
    <AppShell>
      <header className="mb-4 flex items-center justify-between pt-2">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="size-11 rounded-full border border-white/10 bg-white/5"
        >
          <Link href="/app/pacts" aria-label="Back">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="size-11 rounded-full border border-white/10 bg-white/5"
        >
          <Link
            href={`/app/new?pactId=${pact._id}`}
            aria-label="Add commitment"
          >
            <Plus className="size-5" />
          </Link>
        </Button>
      </header>

      <SurfaceCard
        tone={pact.tone ?? "signal"}
        padding="lg"
        className="rounded-[2rem]"
      >
        <StatusChip
          label={healthStatus.replaceAll("_", " ")}
          tone={
            healthStatus === "healthy"
              ? "mint"
              : healthStatus === "at_risk"
                ? "coral"
                : healthStatus === "completed"
                  ? "signal"
                  : healthStatus === "paused"
                    ? "muted"
                    : "volt"
          }
          className="mb-3 capitalize"
        />
        <h1 className="font-heading text-4xl leading-none font-extrabold tracking-tight">
          {pact.title}
        </h1>
        {pact.description ? (
          <p className="mt-3 text-sm font-medium opacity-80">{pact.description}</p>
        ) : null}

        {health?.reasons?.length ? (
          <ul className="mt-4 space-y-1.5 rounded-[1.25rem] bg-black/10 p-3">
            {health.reasons.slice(0, 4).map((reason) => (
              <li key={reason.code} className="text-sm font-medium opacity-85">
                · {reason.label}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 text-right text-xs font-semibold opacity-70">
          <p>
            {pact.accountabilityStyle
              ? styleLabel[
                  pact.accountabilityStyle as keyof typeof styleLabel
                ]
              : "Supportive"}
          </p>
          <p>
            {pact.checkInFrequency
              ? frequencyLabel[
                  pact.checkInFrequency as keyof typeof frequencyLabel
                ]
              : "Daily"}{" "}
            check-ins
          </p>
        </div>
      </SurfaceCard>

      <section className="mt-5">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Commitments
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/65">
              {commitments.length}
            </span>
            <Link
              href={`/app/new?pactId=${pact._id}`}
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-white/15 px-3 text-xs font-semibold text-white/75 transition-colors hover:border-white/35 hover:text-white"
            >
              <Plus className="size-3.5" />
              Add
            </Link>
          </div>
        </div>

        {commitments.length === 0 ? (
          <SurfaceCard tone="ink" padding="lg" className="border border-white/10">
            <p className="font-heading text-xl font-bold tracking-tight">
              This Pact has no commitments yet
            </p>
            <p className="mt-2 text-sm text-white/65">
              Add the first one so partners know what you are holding each other
              to.
            </p>
            <Button
              asChild
              className="mt-5 h-12 w-full rounded-full bg-signal text-base font-bold text-ink-950"
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
          {!inviteExpanded ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-signal/15 text-signal">
                  <UserPlus className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Invite a partner</p>
                  <p className="mt-0.5 text-xs text-white/55">
                    Share a link when you want someone keeping you honest.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setInviteExpanded(true)}
                  className="h-10 shrink-0 rounded-full bg-signal px-4 text-sm font-semibold text-ink-950"
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
                variant="ghost"
                className="h-11 w-full rounded-full border border-white/15 text-white/75"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                {activeToken ? "Refresh invite link" : "Create invite link"}
              </Button>

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
