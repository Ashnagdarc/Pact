"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { cn } from "@/lib/utils";
import {
  createPactSchema,
  frequencyLabel,
  goalTypeLabel,
  styleLabel,
  type CreatePactValues,
} from "@/lib/validation/pact";

const tones: CreatePactValues["tone"][] = [
  "signal",
  "volt",
  "cream",
  "mint",
  "coral",
  "paper",
];

export function CreatePactScreen() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <CreatePactForm />;
}

function CreatePactForm() {
  const router = useRouter();
  const { userId, loading, error } = useCurrentUser();
  const createPact = useMutation(api.pacts.create);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreatePactValues>({
    resolver: zodResolver(createPactSchema),
    defaultValues: {
      title: "",
      description: "",
      goalType: "career",
      accountabilityStyle: "supportive",
      checkInFrequency: "daily",
      tone: "signal",
    },
  });

  const selectedTone = form.watch("tone");
  const selectedGoal = form.watch("goalType");
  const selectedStyle = form.watch("accountabilityStyle");
  const selectedFrequency = form.watch("checkInFrequency");

  async function onSubmit(values: CreatePactValues) {
    if (!userId) return;
    setSubmitting(true);
    try {
      const result = await createPact({
        ownerId: userId,
        title: values.title,
        description: values.description || undefined,
        goalType: values.goalType,
        accountabilityStyle: values.accountabilityStyle,
        checkInFrequency: values.checkInFrequency,
        tone: values.tone,
        createInvite: true,
      });

      router.push(`/pacts/${result.pactId}?created=1`);
    } catch (err) {
      form.setError("title", {
        message: err instanceof Error ? err.message : "Could not create Pact",
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
        New Pact
      </h1>
      <p className="mt-2 text-sm text-white/55">
        Set the agreement, then share an invite link.
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <SurfaceCard tone={selectedTone} padding="lg" className="rounded-[2rem]">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide opacity-60">
            Goal
          </label>
          <Input
            {...form.register("title")}
            placeholder="Ship portfolio by August"
            className="h-12 rounded-2xl border-black/10 bg-white/40 text-base font-semibold text-ink-950 placeholder:text-ink-950/40"
          />
          {form.formState.errors.title ? (
            <p className="mt-2 text-sm font-medium text-ink-950/70">
              {form.formState.errors.title.message}
            </p>
          ) : null}

          <label className="mt-4 mb-2 block text-xs font-semibold uppercase tracking-wide opacity-60">
            Why it matters
          </label>
          <Textarea
            {...form.register("description")}
            placeholder="Optional context for your partner"
            rows={3}
            className="rounded-2xl border-black/10 bg-white/40 text-sm text-ink-950 placeholder:text-ink-950/40"
          />
        </SurfaceCard>

        <ChoiceCard
          label="Type"
          options={Object.entries(goalTypeLabel).map(([id, label]) => ({
            id: id as CreatePactValues["goalType"],
            label,
          }))}
          value={selectedGoal}
          onChange={(id) => form.setValue("goalType", id)}
        />

        <ChoiceCard
          label="Accountability style"
          options={Object.entries(styleLabel).map(([id, label]) => ({
            id: id as CreatePactValues["accountabilityStyle"],
            label,
          }))}
          value={selectedStyle}
          onChange={(id) => form.setValue("accountabilityStyle", id)}
        />

        <ChoiceCard
          label="Check-ins"
          options={Object.entries(frequencyLabel).map(([id, label]) => ({
            id: id as CreatePactValues["checkInFrequency"],
            label,
          }))}
          value={selectedFrequency}
          onChange={(id) => form.setValue("checkInFrequency", id)}
        />

        <SurfaceCard tone="ink" className="border border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
            Board color
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
                  selectedTone === tone ? "scale-110 border-white" : "border-transparent"
                )}
              />
            ))}
          </div>
        </SurfaceCard>

        <Button
          type="submit"
          disabled={submitting}
          className="h-14 w-full rounded-full bg-signal text-base font-bold text-white hover:bg-signal/90"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Pact + invite link"
          )}
        </Button>
      </form>
    </AppShell>
  );
}

function ChoiceCard<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <SurfaceCard tone="ink" className="border border-white/10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/45">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
              value === option.id
                ? "border-volt-500 bg-volt-500 text-ink-950"
                : "border-white/15 text-white/70 hover:border-white/35"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </SurfaceCard>
  );
}
