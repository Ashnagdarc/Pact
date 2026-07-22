"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  LifeBuoy,
  Loader2,
  MoreHorizontal,
  Upload,
} from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { SurfaceCard } from "@/components/cards/surface-card";
import { StatusChip } from "@/components/feedback/status-chip";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-demo-user";
import {
  checkInSignalLabel,
  checkInSignals,
  partnerResponseLabel,
  partnerResponseTypes,
  type CheckInSignal,
  type PartnerResponseType,
} from "@/lib/check-in";
import {
  clearCheckInDraft,
  readCheckInDraft,
  saveCheckInDraft,
} from "@/lib/offline-drafts";
import {
  blockerLabel,
  needsRescue,
  recoveryActionLabel,
  type BlockerType,
  type RecoveryAction,
} from "@/lib/rescue";
import type { CommitmentStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

type CommitmentDetailScreenProps = {
  commitmentId: string;
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

export function CommitmentDetailScreen({
  commitmentId,
}: CommitmentDetailScreenProps) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <CommitmentDetailConnected commitmentId={commitmentId} />;
}

function CommitmentDetailConnected({
  commitmentId,
}: CommitmentDetailScreenProps) {
  const { userId, loading: userLoading } = useCurrentUser();
  const detail = useQuery(
    api.commitments.getById,
    userId
      ? { commitmentId: commitmentId as Id<"commitments"> }
      : "skip"
  );
  const checkIns = useQuery(
    api.checkIns.listForCommitment,
    userId
      ? { commitmentId: commitmentId as Id<"commitments"> }
      : "skip"
  );
  const recoveryPlans = useQuery(
    api.rescue.listForCommitment,
    userId
      ? { commitmentId: commitmentId as Id<"commitments"> }
      : "skip"
  );

  const submitCheckIn = useMutation(api.checkIns.submit);
  const respond = useMutation(api.checkIns.respond);
  const toggleChecklist = useMutation(api.commitments.toggleChecklistItem);
  const updateStatus = useMutation(api.commitments.updateStatus);
  const reviewPlan = useMutation(api.rescue.reviewPlan);
  const generateUploadUrl = useMutation(api.evidence.generateUploadUrl);
  const attachEvidence = useMutation(api.evidence.attach);
  const evidence = useQuery(
    api.evidence.listForCommitment,
    userId
      ? { commitmentId: commitmentId as Id<"commitments"> }
      : "skip"
  );

  const [note, setNote] = useState("");
  const [pendingSignal, setPendingSignal] = useState<CheckInSignal | null>(
    null
  );
  const [isPending, startTransition] = useTransition();
  const [draftHint, setDraftHint] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void readCheckInDraft(commitmentId).then((draft) => {
      if (cancelled || !draft) return;
      setNote(draft.note);
      setDraftHint("Restored offline draft");
    });
    return () => {
      cancelled = true;
    };
  }, [commitmentId]);

  useEffect(() => {
    if (!note.trim()) {
      void clearCheckInDraft(commitmentId);
      return;
    }
    const timer = window.setTimeout(() => {
      void saveCheckInDraft({
        commitmentId,
        signal: pendingSignal ?? "on_track",
        note,
      }).then(() => setDraftHint("Draft saved offline"));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [commitmentId, note, pendingSignal]);

  if (
    userLoading ||
    detail === undefined ||
    checkIns === undefined ||
    recoveryPlans === undefined ||
    evidence === undefined
  ) {
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
          <p className="mt-2 text-sm opacity-80">
            This commitment may have been removed.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/">Back to Today</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  const { commitment, pact } = detail;
  const tone = commitment.tone ?? "volt";
  const uiStatus = toUiStatus(commitment.status);
  const showRescue = needsRescue({
    status: commitment.status,
    dueAt: commitment.dueAt,
  });

  function sendSignal(signal: CheckInSignal) {
    if (!userId) return;
    setPendingSignal(signal);
    startTransition(async () => {
      await submitCheckIn({
        commitmentId: commitment._id,
        signal,
        note: note.trim() || undefined,
      });
      setNote("");
      setPendingSignal(null);
      setDraftHint(null);
      await clearCheckInDraft(commitmentId);
    });
  }

  function markDone() {
    startTransition(async () => {
      try {
        await updateStatus({
          commitmentId: commitment._id,
          status: "done",
        });
        setUploadError(null);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Could not mark done"
        );
      }
    });
  }

  function onPickEvidence(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !userId) return;
    startTransition(async () => {
      try {
        setUploadError(null);
        const postUrl = await generateUploadUrl({});
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!result.ok) {
          throw new Error("Upload failed");
        }
        const { storageId } = (await result.json()) as {
          storageId: Id<"_storage">;
        };
        await attachEvidence({
          commitmentId: commitment._id,
          storageId,
          fileType: file.type || "application/octet-stream",
          caption: file.name,
        });
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Could not upload evidence"
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  async function sendPartnerResponse(
    checkInId: Id<"checkIns">,
    responseType: PartnerResponseType
  ) {
    if (!userId) return;
    startTransition(async () => {
      await respond({
        checkInId,
        responseType,
      });
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
          <Link href="/" aria-label="Back">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-11 rounded-full border border-white/10 bg-white/5"
          aria-label="More"
        >
          <MoreHorizontal className="size-5" />
        </Button>
      </header>

      <SurfaceCard tone={tone} padding="lg" className="rounded-[2rem]">
        {pact ? (
          <span className="mb-3 inline-flex rounded-full border border-ink-950/20 px-3 py-1 text-xs font-semibold">
            {pact.title}
          </span>
        ) : (
          <span className="mb-3 inline-flex rounded-full border border-ink-950/20 px-3 py-1 text-xs font-semibold">
            Personal
          </span>
        )}

        <h1 className="font-heading text-4xl leading-none font-extrabold tracking-tight">
          {commitment.title}
        </h1>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-55">
              Status
            </p>
            <div className="mt-2">
              {uiStatus ? <StatusChip status={uiStatus} /> : null}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-55">
              Due
            </p>
            <p className="mt-2 text-lg font-bold">
              {commitment.dueAt
                ? format(commitment.dueAt, "MMM d, yyyy")
                : "No due date"}
            </p>
          </div>
        </div>

        {commitment.description ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide opacity-55">
              Notes
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed opacity-80">
              {commitment.description}
            </p>
          </div>
        ) : null}

        {commitment.checklist?.length ? (
          <ul className="mt-5 space-y-2.5">
            {commitment.checklist.map((item, index) => (
              <li key={`${item.label}-${index}`}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await toggleChecklist({
                        commitmentId: commitment._id,
                        index,
                      });
                    })
                  }
                  className="flex w-full items-center gap-3 rounded-2xl bg-black/5 px-3 py-3 text-left text-sm font-semibold"
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full border border-current/30",
                      item.done && "border-ink-950 bg-ink-950 text-white"
                    )}
                  >
                    {item.done ? <Check className="size-3.5" /> : null}
                  </span>
                  <span className={cn(item.done && "line-through opacity-55")}>
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </SurfaceCard>

      {showRescue ? (
        <SurfaceCard tone="coral" className="mt-4 rounded-[1.75rem]">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink-950/10">
              <LifeBuoy className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-bold">Needs rescue</p>
              <p className="mt-1 text-sm font-medium opacity-80">
                Recover together — revise scope, reschedule, or ask for help.
              </p>
              <Button
                asChild
                className="mt-3 h-11 rounded-full bg-ink-950 text-white hover:bg-ink-950/90"
              >
                <Link href={`/rescue/${commitment._id}`}>Open Rescue Mode</Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <section className="mt-5">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Evidence
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {commitment.evidenceRequired
                ? "Required before marking done"
                : "Optional proof for your partner"}
            </p>
          </div>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => fileInputRef.current?.click()}
            className="h-10 rounded-full bg-white/10 text-white hover:bg-white/15"
          >
            <Upload className="size-4" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onPickEvidence(e.target.files)}
          />
        </div>
        {uploadError ? (
          <p className="mb-2 text-sm text-coral-400">{uploadError}</p>
        ) : null}
        <div className="space-y-2">
          {evidence.length === 0 ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="text-sm text-white/60">No evidence yet.</p>
            </SurfaceCard>
          ) : (
            evidence.map((item) => (
              <SurfaceCard
                key={item._id}
                tone="ink"
                className="border border-white/10"
              >
                {item.url && item.fileType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.caption ?? "Evidence"}
                    className="mb-2 max-h-48 w-full rounded-xl object-cover"
                  />
                ) : null}
                <p className="text-sm font-semibold">
                  {item.caption ?? item.fileType}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  {format(item._creationTime, "MMM d · h:mm a")}
                </p>
                {item.url && !item.fileType.startsWith("image/") ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-signal underline-offset-2 hover:underline"
                  >
                    Open file
                  </a>
                ) : null}
              </SurfaceCard>
            ))
          )}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Check in
        </h2>
        <p className="mt-1 text-sm text-white/55">
          Five-second progress signal for your partner.
        </p>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note"
          rows={2}
          className="mt-3 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/35"
        />
        {draftHint ? (
          <p className="mt-1.5 text-xs text-white/40">{draftHint}</p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {checkInSignals.map((signal) => (
            <button
              key={signal}
              type="button"
              disabled={isPending}
              onClick={() => sendSignal(signal)}
              className={cn(
                "min-h-12 rounded-2xl border px-3 text-sm font-semibold transition-colors",
                signal === "done" && "border-mint-300/40 bg-mint-300/15 text-mint-300",
                signal === "on_track" && "border-signal/40 bg-signal/15 text-signal",
                signal === "slipping" && "border-volt-500/40 bg-volt-500/15 text-volt-500",
                signal === "blocked" && "border-coral-400/40 bg-coral-400/15 text-coral-400",
                signal === "need_help" && "border-coral-400/50 bg-coral-400/20 text-coral-400",
                pendingSignal === signal && "ring-2 ring-white/40"
              )}
            >
              {pendingSignal === signal ? "Sending…" : checkInSignalLabel[signal]}
            </button>
          ))}
        </div>
      </section>

      <Button
        type="button"
        disabled={isPending || commitment.status === "done"}
        onClick={markDone}
        className="mt-5 h-14 w-full rounded-full bg-ink-800 text-base font-bold text-white hover:bg-ink-800/90"
      >
        <span className="mr-2 inline-flex size-8 items-center justify-center rounded-full bg-white text-ink-950">
          <Check className="size-4" />
        </span>
        {commitment.status === "done" ? "Already done" : "Set as done"}
      </Button>

      {recoveryPlans.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Recovery plans
          </h2>
          <div className="mt-3 space-y-3">
            {recoveryPlans.map((plan) => (
              <SurfaceCard
                key={plan._id}
                tone="ink"
                className="border border-white/10"
              >
                <p className="text-sm font-semibold">
                  {recoveryActionLabel[plan.recoveryAction as RecoveryAction]}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Blocker: {blockerLabel[plan.blockerType as BlockerType]} ·{" "}
                  {format(plan._creationTime, "MMM d · h:mm a")}
                </p>
                {plan.note ? (
                  <p className="mt-2 text-sm text-white/75">{plan.note}</p>
                ) : null}
                <p className="mt-2 text-xs font-semibold capitalize text-white/45">
                  {plan.approvalStatus.replaceAll("_", " ")}
                </p>
                {plan.approvalStatus === "pending" && userId ? (
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await reviewPlan({
                          planId: plan._id,
                          approvalStatus: "acknowledged",
                        });
                      })
                    }
                    className="mt-3 h-10 rounded-full bg-signal text-sm font-bold text-white"
                  >
                    Acknowledge as partner
                  </Button>
                ) : null}
              </SurfaceCard>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Activity
        </h2>
        <div className="mt-3 space-y-3">
          {checkIns.length === 0 ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="text-sm text-white/60">
                No check-ins yet. Send your first signal above.
              </p>
            </SurfaceCard>
          ) : (
            checkIns.map(({ checkIn, user, responses }) => (
              <SurfaceCard
                key={checkIn._id}
                tone="ink"
                className="border border-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {user?.displayName ?? "Someone"} ·{" "}
                      {checkInSignalLabel[checkIn.signal]}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {format(checkIn._creationTime, "MMM d · h:mm a")}
                    </p>
                    {checkIn.note ? (
                      <p className="mt-2 text-sm text-white/75">{checkIn.note}</p>
                    ) : null}
                  </div>
                  <StatusChip
                    label={checkInSignalLabel[checkIn.signal]}
                    tone={
                      checkIn.signal === "done"
                        ? "mint"
                        : checkIn.signal === "on_track"
                          ? "signal"
                          : checkIn.signal === "slipping"
                            ? "volt"
                            : "coral"
                    }
                  />
                </div>

                {responses.length > 0 ? (
                  <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    {responses.map(({ response, responder }) => (
                      <li
                        key={response._id}
                        className="rounded-xl bg-white/5 px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-white/90">
                          {responder?.displayName ?? "Partner"}
                        </span>
                        <span className="text-white/50"> · </span>
                        <span className="text-white/75">
                          {partnerResponseLabel[response.responseType]}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
                    Partner response
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {partnerResponseTypes.slice(0, 4).map((type) => (
                      <button
                        key={type}
                        type="button"
                        disabled={isPending}
                        onClick={() => sendPartnerResponse(checkIn._id, type)}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 hover:border-white/40 hover:text-white"
                      >
                        {partnerResponseLabel[type]}
                      </button>
                    ))}
                  </div>
                </div>
              </SurfaceCard>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
