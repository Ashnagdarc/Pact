"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  clearCreateDraft,
  readCreateDraft,
  saveCreateDraft,
} from "@/lib/offline-drafts";
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

const recurrenceOptions: {
  id: CreateCommitmentValues["recurrenceRule"];
  label: string;
}[] = [
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "weekly", label: "Weekly" },
];

export function NewCommitmentScreen({
  initialPactId,
  initialAsPersonalTask,
}: {
  initialPactId?: string;
  initialAsPersonalTask?: boolean;
}) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return (
    <NewCommitmentForm
      initialPactId={initialPactId}
      initialAsPersonalTask={initialAsPersonalTask}
    />
  );
}

function NewCommitmentForm({
  initialPactId,
  initialAsPersonalTask,
}: {
  initialPactId?: string;
  initialAsPersonalTask?: boolean;
}) {
  const router = useRouter();
  const { userId, loading, error } = useCurrentUser();
  const boards = useQuery(api.pacts.listForUser, userId ? {} : "skip");
  const createCommitment = useMutation(api.commitments.create);
  const createTask = useMutation(api.tasks.create);
  const [submitting, setSubmitting] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [draftHint, setDraftHint] = useState<string | null>(null);
  const defaultedPactRef = useRef(false);
  const draftHydratedRef = useRef(false);

  const preferPersonal = Boolean(initialAsPersonalTask) || !initialPactId;
  const draftScope = initialAsPersonalTask
    ? "new-task"
    : initialPactId
      ? `pact:${initialPactId}`
      : "new";

  const form = useForm<CreateCommitmentValues>({
    resolver: zodResolver(createCommitmentSchema),
    defaultValues: {
      title: "",
      description: "",
      pactId: initialAsPersonalTask ? "" : (initialPactId ?? ""),
      assigneeId: "",
      duePreset: "today",
      evidenceRequired: false,
      asPersonalTask: preferPersonal,
      tone: "volt",
      isRecurring: false,
      recurrenceRule: "weekly",
    },
  });

  const selectedTone = form.watch("tone");
  const selectedDue = form.watch("duePreset");
  const selectedPact = form.watch("pactId");
  const selectedAssignee = form.watch("assigneeId");
  const evidenceRequired = form.watch("evidenceRequired");
  const asPersonalTask = form.watch("asPersonalTask");
  const isRecurring = form.watch("isRecurring");
  const recurrenceRule = form.watch("recurrenceRule");
  const watchedTitle = form.watch("title");
  const watchedDescription = form.watch("description");

  useEffect(() => {
    if (draftHydratedRef.current) return;
    draftHydratedRef.current = true;
    void readCreateDraft(draftScope).then((draft) => {
      if (!draft) return;
      form.reset({
        title: draft.title,
        description: draft.description,
        pactId: draft.pactId || (initialAsPersonalTask ? "" : (initialPactId ?? "")),
        assigneeId: draft.assigneeId,
        duePreset: (draft.duePreset as CreateCommitmentValues["duePreset"]) || "today",
        evidenceRequired: draft.evidenceRequired,
        asPersonalTask: draft.asPersonalTask,
        tone: (draft.tone as CreateCommitmentValues["tone"]) || "volt",
        isRecurring: draft.isRecurring,
        recurrenceRule:
          (draft.recurrenceRule as CreateCommitmentValues["recurrenceRule"]) ||
          "weekly",
      });
      setDraftHint("Restored offline draft");
    });
  }, [draftScope, form, initialAsPersonalTask, initialPactId]);

  useEffect(() => {
    if (!draftHydratedRef.current) return;
    const handle = window.setTimeout(() => {
      void saveCreateDraft(draftScope, {
        title: watchedTitle,
        description: watchedDescription ?? "",
        duePreset: selectedDue,
        evidenceRequired,
        asPersonalTask,
        tone: selectedTone,
        pactId: selectedPact ?? "",
        assigneeId: selectedAssignee ?? "",
        isRecurring,
        recurrenceRule,
      });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [
    asPersonalTask,
    draftScope,
    evidenceRequired,
    isRecurring,
    recurrenceRule,
    selectedAssignee,
    selectedDue,
    selectedPact,
    selectedTone,
    watchedDescription,
    watchedTitle,
  ]);

  const availableBoards = useMemo(
    () => (boards ?? []).filter((board): board is NonNullable<typeof board> => Boolean(board)),
    [boards]
  );

  const pactDetail = useQuery(
    api.pacts.getById,
    userId && selectedPact
      ? { pactId: selectedPact as Id<"pacts"> }
      : "skip"
  );

  const contextPactTitle = useMemo(() => {
    if (!initialPactId) return null;
    const fromBoards = availableBoards.find((b) => b.pact._id === initialPactId);
    if (fromBoards) return fromBoards.pact.title;
    if (
      pactDetail &&
      !pactDetail.forbidden &&
      pactDetail.pact &&
      pactDetail.pact._id === initialPactId
    ) {
      return pactDetail.pact.title;
    }
    return null;
  }, [availableBoards, initialPactId, pactDetail]);

  const assignees = useMemo(() => {
    if (!pactDetail || pactDetail.forbidden || !pactDetail.members) return [];
    return pactDetail.members
      .filter((m) => m?.membership.invitationStatus === "accepted" && m.user)
      .map((m) => m!.user);
  }, [pactDetail]);

  // When opening New with no pactId, prefer the user's most recent Pact —
  // unless the create sheet asked for a personal task explicitly.
  useEffect(() => {
    if (initialPactId || initialAsPersonalTask || defaultedPactRef.current) {
      return;
    }
    if (boards === undefined) return;
    defaultedPactRef.current = true;
    if (availableBoards.length === 0) {
      form.setValue("asPersonalTask", true);
      form.setValue("pactId", "");
      return;
    }
    const preferred = availableBoards[0].pact._id;
    form.setValue("pactId", preferred);
    form.setValue("asPersonalTask", false);
  }, [
    availableBoards,
    boards,
    form,
    initialAsPersonalTask,
    initialPactId,
  ]);

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
        await clearCreateDraft(draftScope);
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
        isRecurring: values.isRecurring || undefined,
        recurrenceRule: values.isRecurring ? values.recurrenceRule : undefined,
      });
      await clearCreateDraft(draftScope);

      if (values.pactId) {
        router.push(`/app/pacts/${values.pactId}`);
        return;
      }

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

  const fromPact = Boolean(initialPactId);
  const boardsLoading = !fromPact && boards === undefined;
  const hasPacts = availableBoards.length > 0;
  const destinationReady = fromPact || boards !== undefined;

  return (
    <AppShell>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        {fromPact ? "Add commitment" : "New commitment"}
      </h1>
      <p className="mt-2 text-sm text-white/70">
        {fromPact ? (
          <>
            Adding to{" "}
            <span className="font-semibold text-white">
              {contextPactTitle ?? "this Pact"}
            </span>
            .
          </>
        ) : hasPacts ? (
          <>
            Pick a Pact below, or keep it personal.{" "}
            <Link
              href="/app/pacts/new"
              className="text-signal underline-offset-2 hover:underline"
            >
              Create a Pact instead
            </Link>
          </>
        ) : boardsLoading ? (
          "Loading your Pacts…"
        ) : (
          <>
            Title + due date, under 10 seconds.{" "}
            <Link
              href="/app/pacts/new"
              className="text-signal underline-offset-2 hover:underline"
            >
              Create a Pact instead
            </Link>
          </>
        )}
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
            Where
          </p>
          {boardsLoading ? (
            <p className="text-sm text-white/55">Loading destinations…</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {!fromPact ? (
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("pactId", "");
                      form.setValue("asPersonalTask", true);
                    }}
                    className={cn(
                      "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                      !selectedPact
                        ? "border-signal bg-signal text-ink-950"
                        : "border-white/15 text-white/70"
                    )}
                  >
                    Personal task
                  </button>
                ) : null}
                {availableBoards.map((board) => (
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
                        ? "border-signal bg-signal text-ink-950"
                        : "border-white/15 text-white/70"
                    )}
                  >
                    {board.pact.title}
                  </button>
                ))}
              </div>
              {!selectedPact ? (
                <p className="mt-3 text-xs text-white/65">
                  Personal tasks stay private. Pick a Pact to make it a shared
                  commitment.
                </p>
              ) : fromPact ? (
                <p className="mt-3 text-xs text-white/65">
                  This will show up on the Pact for you and your partners.
                </p>
              ) : (
                <p className="mt-3 text-xs text-white/65">
                  Shared with partners on this Pact. Switch to Personal task to
                  keep it private.
                </p>
              )}
            </>
          )}
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
                    ? "border-volt-500 bg-volt-500 text-white"
                    : "border-white/15 text-white/70 hover:border-white/35"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          {form.formState.errors.duePreset ? (
            <p className="mt-2 text-xs text-coral-400">
              {form.formState.errors.duePreset.message}
            </p>
          ) : null}
        </SurfaceCard>

        {!asPersonalTask ? (
          <SurfaceCard tone="ink" className="border border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/65">
                  Repeat
                </p>
                <p className="mt-1 text-xs text-white/55">
                  Spawn the next one when you mark this done.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => form.setValue("isRecurring", !isRecurring)}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors",
                  isRecurring ? "bg-volt-500" : "bg-white/15"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 size-6 rounded-full bg-white transition-transform",
                    isRecurring ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            {isRecurring ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {recurrenceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => form.setValue("recurrenceRule", option.id)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                      recurrenceRule === option.id
                        ? "border-volt-500 bg-volt-500 text-white"
                        : "border-white/15 text-white/70"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
            {form.formState.errors.isRecurring ? (
              <p className="mt-2 text-xs text-coral-400">
                {form.formState.errors.isRecurring.message}
              </p>
            ) : null}
          </SurfaceCard>
        ) : null}

        {draftHint ? (
          <p className="text-center text-[11px] text-white/45">{draftHint}</p>
        ) : null}

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
                      ? "border-volt-500 bg-volt-500 text-white"
                      : "border-white/15 text-white/70"
                  )}
                >
                  {member._id === userId ? "You" : member.displayName}
                </button>
              ))}
            </div>
          </SurfaceCard>
        ) : null}

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
          disabled={submitting || !destinationReady}
          size="xl"
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </>
          ) : fromPact && selectedPact ? (
            "Add to this Pact"
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
