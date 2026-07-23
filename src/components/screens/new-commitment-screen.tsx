"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { ChevronDown, Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { cn } from "@/lib/utils";
import {
  createCommitmentSchema,
  dueAtFromPreset,
  type CreateCommitmentValues,
} from "@/lib/validation/commitment";

const tones: CreateCommitmentValues["tone"][] = [
  "volt",
  "coral",
  "cream",
  "mint",
  "signal",
  "paper",
];

const dueOptions: { id: CreateCommitmentValues["duePreset"]; label: string }[] =
  [
    { id: "today", label: "Today" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "week", label: "In a week" },
    { id: "none", label: "No due date" },
  ];

export function NewCommitmentScreen({
  initialPactId,
}: {
  initialPactId?: string;
}) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <NewCommitmentForm initialPactId={initialPactId} />;
}

function NewCommitmentForm({ initialPactId }: { initialPactId?: string }) {
  const router = useRouter();
  const { userId, loading, error } = useCurrentUser();
  const boards = useQuery(api.pacts.listForUser, userId ? {} : "skip");
  const createCommitment = useMutation(api.commitments.create);
  const createTask = useMutation(api.tasks.create);
  const [submitting, setSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(Boolean(initialPactId));

  const form = useForm<CreateCommitmentValues>({
    resolver: zodResolver(createCommitmentSchema),
    defaultValues: {
      title: "",
      description: "",
      pactId: initialPactId ?? "",
      assigneeId: "",
      duePreset: "today",
      evidenceRequired: false,
      asPersonalTask: !initialPactId,
      tone: "volt",
    },
  });

  const selectedTone = form.watch("tone");
  const selectedDue = form.watch("duePreset");
  const selectedPact = form.watch("pactId");
  const selectedAssignee = form.watch("assigneeId");
  const evidenceRequired = form.watch("evidenceRequired");
  const asPersonalTask = form.watch("asPersonalTask");

  const pactDetail = useQuery(
    api.pacts.getById,
    userId && selectedPact
      ? { pactId: selectedPact as Id<"pacts"> }
      : "skip"
  );

  const assignees = useMemo(() => {
    if (!pactDetail || pactDetail.forbidden || !pactDetail.members) return [];
    return pactDetail.members
      .filter((m) => m?.membership.invitationStatus === "accepted" && m.user)
      .map((m) => m!.user);
  }, [pactDetail]);

  useEffect(() => {
    if (!userId) return;
    if (!selectedPact) {
      form.setValue("assigneeId", userId);
      form.setValue("asPersonalTask", true);
      return;
    }
    form.setValue("asPersonalTask", false);
    if (!selectedAssignee || !assignees.some((a) => a._id === selectedAssignee)) {
      form.setValue("assigneeId", userId);
    }
  }, [assignees, form, selectedAssignee, selectedPact, userId]);

  async function onSubmit(values: CreateCommitmentValues) {
    if (!userId) return;

    setSubmitting(true);
    try {
      if (!values.pactId && values.asPersonalTask) {
        const taskId = await createTask({
          title: values.title,
          description: values.description || undefined,
          dueAt: dueAtFromPreset(values.duePreset),
          reminderAt: dueAtFromPreset(values.duePreset)
            ? Math.max(
                Date.now() + 60_000,
                (dueAtFromPreset(values.duePreset) as number) - 60 * 60 * 1000
              )
            : undefined,
          tone: values.tone,
        });
        router.push(`/app/tasks/${taskId}`);
        return;
      }

      const commitmentId = await createCommitment({
        assigneeId: (values.assigneeId || userId) as Id<"users">,
        title: values.title,
        description: values.description || undefined,
        pactId: values.pactId
          ? (values.pactId as Id<"pacts">)
          : undefined,
        dueAt: dueAtFromPreset(values.duePreset),
        tone: values.tone,
        favorited: false,
        evidenceRequired: values.evidenceRequired,
      });

      router.push(`/app/commitments/${commitmentId}`);
    } catch (err) {
      form.setError("title", {
        message:
          err instanceof Error ? err.message : "Could not create commitment",
      });
      setSubmitting(false);
    }
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

  if (error || !userId) {
    return (
      <AppShell>
        <SurfaceCard tone="coral" className="mt-6">
          <p className="font-heading text-xl font-bold">Couldn’t load user</p>
          <p className="mt-2 text-sm opacity-80">{error}</p>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        New
      </h1>
      <p className="mt-2 text-sm text-white/70">
        Title + due date, under 10 seconds.{" "}
        <Link
          href="/app/pacts/new"
          className="text-signal underline-offset-2 hover:underline"
        >
          Create a Pact instead
        </Link>
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <SurfaceCard tone={selectedTone} padding="lg" className="rounded-[2rem]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-950">
            Title
          </label>
          <Input
            {...form.register("title")}
            placeholder="Finish portfolio homepage"
            className="h-12 rounded-2xl border-ink-950/20 bg-white text-base font-semibold text-ink-950 placeholder:text-ink-950/50 dark:bg-white dark:placeholder:text-ink-950/50"
          />
          {form.formState.errors.title ? (
            <p className="mt-2 text-sm font-medium text-ink-950">
              {form.formState.errors.title.message}
            </p>
          ) : null}
        </SurfaceCard>

        <SurfaceCard tone="ink" className="border border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/65">
            Due
          </p>
          <div className="flex flex-wrap gap-2">
            {dueOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => form.setValue("duePreset", option.id)}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                  selectedDue === option.id
                    ? "border-volt-500 bg-volt-500 text-ink-950"
                    : "border-white/15 text-white/70 hover:border-white/35"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </SurfaceCard>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white/85"
          aria-expanded={showMore}
        >
          More options
          <ChevronDown
            className={cn(
              "size-4 text-white/65 transition-transform",
              showMore && "rotate-180"
            )}
          />
        </button>

        {showMore ? (
          <>
            <SurfaceCard tone="ink" className="border border-white/10">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/65">
                Note
              </label>
              <Textarea
                {...form.register("description")}
                placeholder="Optional detail"
                rows={3}
                className="rounded-2xl border-white/10 bg-white/5 text-sm text-white placeholder:text-white/35"
              />
            </SurfaceCard>

            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/65">
                Where
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    form.setValue("pactId", "");
                    form.setValue("asPersonalTask", true);
                  }}
                  className={cn(
                    "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                    !selectedPact
                      ? "border-signal bg-signal text-white"
                      : "border-white/15 text-white/70"
                  )}
                >
                  Personal task
                </button>
                {(boards ?? []).map((board) =>
                  board ? (
                    <button
                      key={board.pact._id}
                      type="button"
                      onClick={() => {
                        form.setValue("pactId", board.pact._id);
                        form.setValue("asPersonalTask", false);
                      }}
                      className={cn(
                        "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                        selectedPact === board.pact._id
                          ? "border-signal bg-signal text-white"
                          : "border-white/15 text-white/70"
                      )}
                    >
                      {board.pact.title}
                    </button>
                  ) : null
                )}
              </div>
              {!selectedPact ? (
                <p className="mt-3 text-xs text-white/65">
                  Personal tasks stay private. Switch to a Pact to assign a
                  partner.
                </p>
              ) : null}
            </SurfaceCard>

            {selectedPact ? (
              <SurfaceCard tone="ink" className="border border-white/10">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/65">
                  Assign to
                </p>
                <div className="flex flex-wrap gap-2">
                  {assignees.map((member) => (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => form.setValue("assigneeId", member._id)}
                      className={cn(
                        "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                        selectedAssignee === member._id
                          ? "border-volt-500 bg-volt-500 text-ink-950"
                          : "border-white/15 text-white/70"
                      )}
                    >
                      {member._id === userId ? "You" : member.displayName}
                    </button>
                  ))}
                </div>
              </SurfaceCard>
            ) : null}

            {selectedPact ? (
              <SurfaceCard tone="ink" className="border border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    form.setValue("evidenceRequired", !evidenceRequired)
                  }
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold">Require evidence</p>
                    <p className="mt-1 text-xs text-white/65">
                      Ask for a photo or file before marking done
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex h-7 w-12 items-center rounded-full border px-1 transition-colors",
                      evidenceRequired
                        ? "border-volt-500 bg-volt-500"
                        : "border-white/20 bg-white/5"
                    )}
                  >
                    <span
                      className={cn(
                        "size-5 rounded-full bg-white transition-transform",
                        evidenceRequired ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </span>
                </button>
              </SurfaceCard>
            ) : null}

            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/65">
                Card color
              </p>
              <div className="flex flex-wrap gap-2">
                {tones.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    aria-label={tone}
                    onClick={() => form.setValue("tone", tone)}
                    className={cn(
                      "size-10 rounded-full border-2",
                      tone === "volt" && "bg-volt-500",
                      tone === "coral" && "bg-coral-400",
                      tone === "cream" && "bg-cream-200",
                      tone === "mint" && "bg-mint-300",
                      tone === "signal" && "bg-signal",
                      tone === "paper" && "bg-paper-100",
                      selectedTone === tone
                        ? "border-white scale-110"
                        : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </SurfaceCard>
          </>
        ) : null}

        <Button
          type="submit"
          disabled={submitting}
          className="h-14 w-full rounded-full bg-volt-500 text-base font-bold text-ink-950 hover:bg-volt-500/90"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </>
          ) : asPersonalTask && !selectedPact ? (
            "Create personal task"
          ) : (
            "Create commitment"
          )}
        </Button>
      </form>
    </AppShell>
  );
}
