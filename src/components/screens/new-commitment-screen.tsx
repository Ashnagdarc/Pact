"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";

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
  const boards = useQuery(
    api.pacts.listForUser,
    userId ? {} : "skip"
  );
  const createCommitment = useMutation(api.commitments.create);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateCommitmentValues>({
    resolver: zodResolver(createCommitmentSchema),
    defaultValues: {
      title: "",
      description: "",
      pactId: initialPactId ?? "",
      duePreset: "today",
      tone: "volt",
    },
  });

  const selectedTone = form.watch("tone");
  const selectedDue = form.watch("duePreset");
  const selectedPact = form.watch("pactId");

  async function onSubmit(values: CreateCommitmentValues) {
    if (!userId) return;

    setSubmitting(true);
    try {
      const commitmentId = await createCommitment({
        assigneeId: userId,
        title: values.title,
        description: values.description || undefined,
        pactId: values.pactId
          ? (values.pactId as Id<"pacts">)
          : undefined,
        dueAt: dueAtFromPreset(values.duePreset),
        tone: values.tone,
        favorited: false,
        evidenceRequired: false,
      });

      router.push(`/commitments/${commitmentId}`);
    } catch (err) {
      form.setError("title", {
        message: err instanceof Error ? err.message : "Could not create commitment",
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
          <p className="font-heading text-xl font-bold">Couldn’t load demo user</p>
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
      <p className="mt-2 text-sm text-white/55">
        Capture a commitment in under 10 seconds.{" "}
        <Link href="/pacts/new" className="text-signal underline-offset-2 hover:underline">
          Create a Pact instead
        </Link>
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <SurfaceCard tone={selectedTone} padding="lg" className="rounded-[2rem]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide opacity-60">
            Title
          </label>
          <Input
            {...form.register("title")}
            placeholder="Finish portfolio homepage"
            className="h-12 rounded-2xl border-black/10 bg-white/40 text-base font-semibold text-ink-950 placeholder:text-ink-950/40"
          />
          {form.formState.errors.title ? (
            <p className="mt-2 text-sm font-medium text-ink-950/70">
              {form.formState.errors.title.message}
            </p>
          ) : null}

          <label className="mt-4 mb-2 block text-xs font-semibold uppercase tracking-wide opacity-60">
            Note
          </label>
          <Textarea
            {...form.register("description")}
            placeholder="Optional detail or evidence note"
            rows={3}
            className="rounded-2xl border-black/10 bg-white/40 text-sm text-ink-950 placeholder:text-ink-950/40"
          />
        </SurfaceCard>

        <SurfaceCard tone="ink" className="border border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
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

        <SurfaceCard tone="ink" className="border border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
            Pact
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => form.setValue("pactId", "")}
              className={cn(
                "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                !selectedPact
                  ? "border-signal bg-signal text-white"
                  : "border-white/15 text-white/70"
              )}
            >
              Personal
            </button>
            {(boards ?? []).map((board) =>
              board ? (
                <button
                  key={board.pact._id}
                  type="button"
                  onClick={() => form.setValue("pactId", board.pact._id)}
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
        </SurfaceCard>

        <SurfaceCard tone="ink" className="border border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
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
          ) : (
            "Create commitment"
          )}
        </Button>
      </form>
    </AppShell>
  );
}
