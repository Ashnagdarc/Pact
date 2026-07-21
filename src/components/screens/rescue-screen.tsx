"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { addDays, format } from "date-fns";
import { ArrowLeft, Loader2, LifeBuoy } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-demo-user";
import {
  blockerLabel,
  blockerTypes,
  recoveryActionHint,
  recoveryActionLabel,
  suggestedActionsFor,
  type BlockerType,
  type RecoveryAction,
} from "@/lib/rescue";
import { cn } from "@/lib/utils";

type RescueScreenProps = {
  commitmentId: string;
};

type Step = "blocker" | "action" | "revise" | "done";

export function RescueScreen({ commitmentId }: RescueScreenProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <RescueScreenConnected commitmentId={commitmentId} />;
}

function RescueScreenConnected({ commitmentId }: RescueScreenProps) {
  const router = useRouter();
  const { userId, loading: userLoading } = useCurrentUser();
  const detail = useQuery(api.commitments.getById, {
    commitmentId: commitmentId as Id<"commitments">,
  });
  const createPlan = useMutation(api.rescue.createPlan);

  const [step, setStep] = useState<Step>("blocker");
  const [blocker, setBlocker] = useState<BlockerType | null>(null);
  const [action, setAction] = useState<RecoveryAction | null>(null);
  const [revisedTitle, setRevisedTitle] = useState("");
  const [splitSteps, setSplitSteps] = useState("Step 1\nStep 2\nStep 3");
  const [note, setNote] = useState("");
  const [duePreset, setDuePreset] = useState<"tomorrow" | "3days" | "week">(
    "tomorrow"
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const suggested = useMemo(
    () => (blocker ? suggestedActionsFor(blocker) : []),
    [blocker]
  );

  if (userLoading || detail === undefined) {
    return (
      <AppShell showTabs={false}>
        <div className="flex min-h-[60dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  if (!detail) {
    return (
      <AppShell showTabs={false}>
        <SurfaceCard tone="coral" className="mt-8">
          <p className="font-heading text-2xl font-bold">Not found</p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/">Back</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  const { commitment, pact } = detail;

  function revisedDueAt() {
    const base = new Date();
    switch (duePreset) {
      case "tomorrow":
        return addDays(base, 1).setHours(18, 0, 0, 0);
      case "3days":
        return addDays(base, 3).setHours(18, 0, 0, 0);
      case "week":
        return addDays(base, 7).setHours(18, 0, 0, 0);
      default: {
        const _exhaustive: never = duePreset;
        return _exhaustive;
      }
    }
  }

  function submitPlan() {
    if (!userId || !blocker || !action) return;
    setError(null);

    startTransition(async () => {
      try {
        const checklist =
          action === "split"
            ? splitSteps
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((label) => ({ label, done: false }))
            : undefined;

        await createPlan({
          commitmentId: commitment._id,
          createdBy: userId,
          blockerType: blocker,
          recoveryAction: action,
          revisedTitle:
            action === "reduce_scope" || action === "split"
              ? revisedTitle.trim() || commitment.title
              : undefined,
          revisedDueAt: action === "reschedule" ? revisedDueAt() : undefined,
          revisedChecklist: checklist,
          note: note.trim() || undefined,
          notifyPartner: Boolean(commitment.pactId),
        });
        setStep("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save recovery");
      }
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
          <Link href={`/commitments/${commitment._id}`} aria-label="Back">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <span className="inline-flex items-center gap-2 rounded-full border border-coral-400/30 bg-coral-400/10 px-3 py-1 text-xs font-semibold text-coral-400">
          <LifeBuoy className="size-3.5" />
          Rescue Mode
        </span>
      </header>

      <SurfaceCard tone="coral" padding="lg" className="rounded-[2rem]">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
          {pact?.title ?? "Personal"}
        </p>
        <h1 className="font-heading mt-1 text-3xl font-extrabold tracking-tight">
          {commitment.title}
        </h1>
        <p className="mt-2 text-sm font-medium opacity-80">
          Missed plans happen. Let&apos;s recover without quitting.
        </p>
      </SurfaceCard>

      {step === "blocker" ? (
        <section className="mt-5">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            What happened?
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Pick the closest reason. No shame — just signal.
          </p>
          <div className="mt-4 grid gap-2">
            {blockerTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setBlocker(type);
                  setAction(null);
                  setStep("action");
                }}
                className="min-h-12 rounded-2xl border border-white/12 bg-white/5 px-4 text-left text-sm font-semibold text-white/85 hover:border-white/30"
              >
                {blockerLabel[type]}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === "action" && blocker ? (
        <section className="mt-5">
          <button
            type="button"
            className="text-xs font-semibold text-white/45 underline-offset-2 hover:underline"
            onClick={() => setStep("blocker")}
          >
            ← Change reason ({blockerLabel[blocker]})
          </button>
          <h2 className="font-heading mt-3 text-2xl font-bold tracking-tight">
            How do you want to recover?
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Suggested first based on your blocker.
          </p>
          <div className="mt-4 grid gap-2">
            {suggested.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setAction(item);
                  setRevisedTitle(commitment.title);
                  setStep("revise");
                }}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left",
                  index === 0
                    ? "border-volt-500/50 bg-volt-500/10"
                    : "border-white/12 bg-white/5"
                )}
              >
                <p className="text-sm font-bold text-white">
                  {recoveryActionLabel[item]}
                  {index === 0 ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-volt-500">
                      Suggested
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-white/55">
                  {recoveryActionHint[item]}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === "revise" && blocker && action ? (
        <section className="mt-5 space-y-4">
          <button
            type="button"
            className="text-xs font-semibold text-white/45 underline-offset-2 hover:underline"
            onClick={() => setStep("action")}
          >
            ← Change recovery
          </button>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            {recoveryActionLabel[action]}
          </h2>

          {(action === "reduce_scope" || action === "split") && (
            <SurfaceCard tone="ink" className="border border-white/10">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/45">
                Revised title
              </label>
              <Input
                value={revisedTitle}
                onChange={(e) => setRevisedTitle(e.target.value)}
                className="h-11 rounded-2xl border-white/10 bg-white/5 text-white"
              />
            </SurfaceCard>
          )}

          {action === "split" ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/45">
                Steps (one per line)
              </label>
              <Textarea
                value={splitSteps}
                onChange={(e) => setSplitSteps(e.target.value)}
                rows={4}
                className="rounded-2xl border-white/10 bg-white/5 text-white"
              />
            </SurfaceCard>
          ) : null}

          {action === "reschedule" ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
                New due date
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["tomorrow", "Tomorrow"],
                    ["3days", "In 3 days"],
                    ["week", "In a week"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDuePreset(id)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 text-sm font-semibold",
                      duePreset === id
                        ? "border-volt-500 bg-volt-500 text-ink-950"
                        : "border-white/15 text-white/70"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/45">
                Sets due to {format(revisedDueAt(), "MMM d, yyyy · h:mm a")}
              </p>
            </SurfaceCard>
          ) : null}

          <SurfaceCard tone="ink" className="border border-white/10">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/45">
              Note for your partner (optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="What should they know?"
              className="rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
            />
          </SurfaceCard>

          {error ? (
            <p className="text-sm font-medium text-coral-400">{error}</p>
          ) : null}

          <Button
            type="button"
            disabled={isPending}
            onClick={submitPlan}
            className="h-14 w-full rounded-full bg-volt-500 text-base font-bold text-ink-950 hover:bg-volt-500/90"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Apply recovery plan"
            )}
          </Button>
        </section>
      ) : null}

      {step === "done" ? (
        <SurfaceCard tone="mint" className="mt-6 rounded-[2rem]">
          <p className="font-heading text-2xl font-bold">You&apos;re back on track</p>
          <p className="mt-2 text-sm font-medium text-ink-950/75">
            Recovery applied
            {action ? ` · ${recoveryActionLabel[action]}` : ""}.
            {commitment.pactId
              ? " Your partner can acknowledge the plan from activity."
              : ""}
          </p>
          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              onClick={() => router.push(`/commitments/${commitment._id}`)}
              className="h-12 rounded-full bg-ink-950 text-white"
            >
              View commitment
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/")}
              className="h-11 rounded-full border border-ink-950/15 text-ink-950"
            >
              Back to Today
            </Button>
          </div>
        </SurfaceCard>
      ) : null}
    </AppShell>
  );
}
