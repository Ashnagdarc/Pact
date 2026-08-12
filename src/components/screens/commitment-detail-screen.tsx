"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  LifeBuoy,
  Loader2,
  Upload,
} from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { SurfaceCard } from "@/components/cards/surface-card";
import { PartnerResponseChips } from "@/components/check-in/partner-response-chips";
import { StatusChip } from "@/components/feedback/status-chip";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { playFeedback } from "@/lib/feedback";
import {
  checkInSignalLabel,
  checkInSignals,
  partnerResponseLabel,
  type CheckInSignal,
  type PartnerResponseType,
} from "@/lib/check-in";
import {
  clearCheckInDraft,
  readCheckInDraft,
  saveCheckInDraft,
} from "@/lib/offline-drafts";
import { EVIDENCE_MAX_BYTES, isAllowedEvidenceMime } from "@/lib/evidence-upload";
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
  const searchParams = useSearchParams();
  const focusReply = searchParams.get("reply") === "1";
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
  const reviewPlan = useMutation(api.rescue.reviewPlan);
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
  const [pendingResponse, setPendingResponse] =
    useState<PartnerResponseType | null>(null);
  const [isPending, startTransition] = useTransition();
  const replyRef = useRef<HTMLDivElement>(null);
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

  const isAssignee = Boolean(
    userId && detail?.commitment?.assigneeId === userId
  );
  const latestReplyTarget = useMemo(() => {
    if (!userId || !checkIns) return null;
    return checkIns.find(({ checkIn }) => checkIn.userId !== userId) ?? null;
  }, [checkIns, userId]);

  useEffect(() => {
    if (!focusReply || !latestReplyTarget) return;
    replyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focusReply, latestReplyTarget]);

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
            <Link href="/app">Back to Today</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  const { commitment, pact } = detail;
  const evidenceItems = evidence;
  const tone = commitment.tone ?? "volt";
  const uiStatus = toUiStatus(commitment.status);
  const needsRescueNow = needsRescue({
    status: commitment.status,
    dueAt: commitment.dueAt,
  });
  const showRescue = isAssignee && needsRescueNow;

  function sendSignal(signal: CheckInSignal) {
    if (!userId) return;
    if (
      signal === "done" &&
      commitment.evidenceRequired &&
      evidenceItems.length === 0
    ) {
      setUploadError("Upload evidence before marking this done");
      return;
    }
    setPendingSignal(signal);
    setUploadError(null);
    startTransition(async () => {
      try {
        await submitCheckIn({
          commitmentId: commitment._id,
          signal,
          note: note.trim() || undefined,
        });
        playFeedback({ sound: "success", haptic: "success" });
        setNote("");
        setDraftHint(null);
        await clearCheckInDraft(commitmentId);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Could not send check-in"
        );
      } finally {
        setPendingSignal(null);
      }
    });
  }

  function onPickEvidence(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !userId) return;
    startTransition(async () => {
      try {
        setUploadError(null);
        const contentType = file.type || "application/octet-stream";
        if (!isAllowedEvidenceMime(contentType)) {
          throw new Error("Only images and PDF files are allowed");
        }
        if (file.size > EVIDENCE_MAX_BYTES) {
          throw new Error(
            `File too large (max ${Math.round(EVIDENCE_MAX_BYTES / (1024 * 1024))} MB)`
          );
        }
        const signRes = await fetch("/api/evidence/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commitmentId: commitment._id,
            contentType,
            byteSize: file.size,
          }),
        });
        const signBody = (await signRes.json().catch(() => null)) as {
          error?: string;
          uploadUrl?: string;
          r2Key?: string;
        } | null;
        if (!signRes.ok || !signBody?.uploadUrl || !signBody.r2Key) {
          throw new Error(signBody?.error ?? "Could not start upload");
        }

        const putRes = await fetch(signBody.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });
        if (!putRes.ok) {
          throw new Error("Upload to storage failed");
        }

        await attachEvidence({
          commitmentId: commitment._id,
          r2Key: signBody.r2Key,
          byteSize: file.size,
          fileType: contentType,
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
    setPendingResponse(responseType);
    startTransition(async () => {
      try {
        await respond({
          checkInId,
          responseType,
        });
        playFeedback({ sound: "success", haptic: "success" });
      } finally {
        setPendingResponse(null);
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
          <Link
            href={pact ? `/app/pacts/${pact._id}` : "/app"}
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </Link>
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
                Recover together: revise scope, reschedule, or ask for help.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-3 bg-ink-950 text-white hover:bg-ink-950/90"
              >
                <Link href={`/app/rescue/${commitment._id}`}>
                  Open Rescue Mode
                </Link>
              </Button>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      {!isAssignee && needsRescueNow && latestReplyTarget ? (
        <SurfaceCard tone="coral" className="mt-4 rounded-[1.75rem]">
          <p className="font-heading text-lg font-bold">Partner needs support</p>
          <p className="mt-1 text-sm font-medium opacity-80">
            Reply in a few taps — no long thread required.
          </p>
          <Button
            type="button"
            size="lg"
            className="mt-3 bg-ink-950 text-white hover:bg-ink-950/90"
            onClick={() =>
              replyRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            Jump to reply
          </Button>
        </SurfaceCard>
      ) : null}

      {!isAssignee && latestReplyTarget ? (
        <div
          id="partner-reply"
          ref={replyRef}
          className="mt-5 scroll-mt-6"
        >
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Reply fast
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Structured partner response — five seconds.
          </p>
          <SurfaceCard tone="ink" className="mt-3 border border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {latestReplyTarget.user?.displayName ?? "Partner"} ·{" "}
                  {checkInSignalLabel[latestReplyTarget.checkIn.signal]}
                </p>
                <p className="mt-1 text-xs text-white/65">
                  {format(
                    latestReplyTarget.checkIn._creationTime,
                    "MMM d · h:mm a"
                  )}
                </p>
                {latestReplyTarget.checkIn.note ? (
                  <p className="mt-2 text-sm text-white/75">
                    {latestReplyTarget.checkIn.note}
                  </p>
                ) : null}
              </div>
              <StatusChip
                label={checkInSignalLabel[latestReplyTarget.checkIn.signal]}
                tone={
                  latestReplyTarget.checkIn.signal === "done"
                    ? "mint"
                    : latestReplyTarget.checkIn.signal === "on_track"
                      ? "signal"
                      : latestReplyTarget.checkIn.signal === "slipping"
                        ? "volt"
                        : "coral"
                }
              />
            </div>
            <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-white/55 uppercase">
              Tap a response
            </p>
            <PartnerResponseChips
              signal={latestReplyTarget.checkIn.signal}
              disabled={isPending}
              pendingType={pendingResponse}
              onSelect={(type) =>
                sendPartnerResponse(latestReplyTarget.checkIn._id, type)
              }
            />
          </SurfaceCard>
        </div>
      ) : null}

      {isAssignee ? (
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
          <p className="mt-1.5 text-xs text-white/60">{draftHint}</p>
        ) : null}
        {uploadError ? (
          <p className="mt-2 text-sm text-coral-400">{uploadError}</p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          {checkInSignals.map((signal) => {
            const doneNeedsEvidence =
              signal === "done" &&
              commitment.evidenceRequired &&
              evidenceItems.length === 0;
            return (
              <button
                key={signal}
                type="button"
                disabled={isPending || doneNeedsEvidence}
                title={
                  doneNeedsEvidence
                    ? "Upload evidence before marking done"
                    : undefined
                }
                onClick={() => sendSignal(signal)}
                className={cn(
                  "min-h-12 rounded-2xl border px-3 text-sm font-semibold transition-colors",
                  signal === "done" && "border-mint-300/40 bg-mint-300/15 text-mint-300",
                  signal === "on_track" && "border-signal/40 bg-signal/15 text-signal",
                  signal === "slipping" && "border-volt-500/40 bg-volt-500/15 text-volt-500",
                  signal === "blocked" && "border-coral-400/40 bg-coral-400/15 text-coral-400",
                  signal === "need_help" && "border-coral-400/50 bg-coral-400/20 text-coral-400",
                  pendingSignal === signal && "ring-2 ring-white/40",
                  doneNeedsEvidence && "opacity-40"
                )}
              >
                {pendingSignal === signal
                  ? "Sending…"
                  : checkInSignalLabel[signal]}
              </button>
            );
          })}
        </div>
        {commitment.evidenceRequired && evidenceItems.length === 0 ? (
          <p className="mt-2 text-xs text-white/50">
            Upload evidence below before you can mark this done.
          </p>
        ) : null}
      </section>
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
        <div className="space-y-2">
          {evidenceItems.length === 0 ? (
            <SurfaceCard tone="ink" className="border border-white/10">
              <p className="text-sm text-white/60">No evidence yet.</p>
            </SurfaceCard>
          ) : (
            evidenceItems.map((item) => {
              const fileUrl =
                item.url ??
                (item.r2Key ? `/api/evidence/${item._id}/file` : null);
              return (
                <SurfaceCard
                  key={item._id}
                  tone="ink"
                  className="border border-white/10"
                >
                  {fileUrl && item.fileType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileUrl}
                      alt={item.caption ?? "Evidence"}
                      className="mb-2 max-h-48 w-full rounded-xl object-cover"
                    />
                  ) : null}
                  <p className="text-sm font-semibold">
                    {item.caption ?? item.fileType}
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    {format(item._creationTime, "MMM d · h:mm a")}
                  </p>
                  {fileUrl && !item.fileType.startsWith("image/") ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-signal underline-offset-2 hover:underline"
                    >
                      Open file
                    </a>
                  ) : null}
                </SurfaceCard>
              );
            })
          )}
        </div>
      </section>

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
                <p className="mt-2 text-xs font-semibold capitalize text-white/65">
                  {plan.approvalStatus.replaceAll("_", " ")}
                </p>
                {plan.approvalStatus === "pending" &&
                userId &&
                plan.createdBy !== userId ? (
                  <Button
                    type="button"
                    disabled={isPending}
                    variant="soft"
                    onClick={() =>
                      startTransition(async () => {
                        await reviewPlan({
                          planId: plan._id,
                          approvalStatus: "acknowledged",
                        });
                      })
                    }
                    className="mt-3"
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
                    <p className="mt-1 text-xs text-white/65">
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

                {checkIn.userId !== userId ? (
                  <div className="mt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                      Partner response
                    </p>
                    <PartnerResponseChips
                      signal={checkIn.signal}
                      disabled={isPending}
                      pendingType={pendingResponse}
                      onSelect={(type) =>
                        sendPartnerResponse(checkIn._id, type)
                      }
                    />
                  </div>
                ) : null}
              </SurfaceCard>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
}
