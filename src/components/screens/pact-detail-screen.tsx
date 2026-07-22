"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Plus, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CommitmentCard } from "@/components/cards/commitment-card";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AvatarStack } from "@/components/feedback/avatar-stack";
import { StatusChip } from "@/components/feedback/status-chip";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { InviteShareCard } from "@/components/screens/invite-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import type { CommitmentStatus } from "@/lib/status";
import {
  frequencyLabel,
  styleLabel,
} from "@/lib/validation/pact";

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
  const refreshHealth = useMutation(api.health.refresh);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (userLoading || detail === undefined || health === undefined) {
    return (
      <AppShell showTabs={false}>
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  if (!detail || detail.forbidden || !detail.pact) {
    return (
      <AppShell showTabs={false}>
        <SurfaceCard tone="coral" className="mt-8">
          <p className="font-heading text-2xl font-bold">Pact unavailable</p>
          <p className="mt-2 text-sm opacity-80">
            Accept an invite first, or ask the owner to share a new link.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/pacts">Back to Pacts</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  const { pact, membership, members, commitments } = detail;
  const activeToken = inviteToken ?? detail.inviteToken;
  const isOwner = membership.role === "owner";
  const healthStatus = health?.status ?? pact.healthStatus;

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
    <AppShell showTabs={false} className="pb-10">
      <header className="mb-4 flex items-center justify-between pt-2">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="size-11 rounded-full border border-white/10 bg-white/5"
        >
          <Link href="/pacts" aria-label="Back">
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
            href={`/new?pactId=${pact._id}`}
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

        <div className="mt-5 flex items-center justify-between gap-3">
          <AvatarStack
            people={members.map((m) => ({
              name: m!.user.displayName,
              src: m!.user.avatarUrl,
            }))}
          />
          <div className="text-right text-xs font-semibold opacity-70">
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
        </div>
      </SurfaceCard>

      {isOwner ? (
        <div className="mt-4 space-y-3">
          {activeToken ? (
            <InviteShareCard token={activeToken} autoFocus={justCreated} />
          ) : (
            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="text-sm text-white/70">
                No active invite link. Generate one to bring in a partner.
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
        </div>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Commitments
          </h2>
          <span className="text-xs font-semibold text-white/45">
            {commitments.length}
          </span>
        </div>

        {commitments.length === 0 ? (
          <SurfaceCard tone="ink" className="border border-white/10">
            <p className="text-sm text-white/65">
              No commitments yet. Add the first one for this Pact.
            </p>
            <Button asChild className="mt-3 rounded-full bg-signal text-white">
              <Link href={`/new?pactId=${pact._id}`}>Add commitment</Link>
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
                favorited={commitment.favorited}
                href={`/commitments/${commitment._id}`}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
