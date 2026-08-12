"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

import { api } from "@convex/_generated/api";
import { CommitmentCard } from "@/components/cards/commitment-card";
import { PactBoardCard } from "@/components/cards/pact-board-card";
import { SurfaceCard } from "@/components/cards/surface-card";
import { TodayPromptCard } from "@/components/cards/today-prompt-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { AppShell } from "@/components/navigation/app-shell";
import { FilterChips } from "@/components/navigation/filter-chips";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { RotatingPactTitle } from "@/components/navigation/rotating-pact-title";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { TodayTimeline } from "@/components/today/today-timeline";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { readOnboardingPending } from "@/lib/onboarding";
import type { CommitmentStatus } from "@/lib/status";

const filters = [
  { id: "all", label: "All" },
  { id: "pacts", label: "Pacts" },
  { id: "blocked", label: "Blocked" },
];

function startOfLocalDayMs(now = Date.now()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

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

export function TodayScreen() {
  const router = useRouter();
  const reduceMotion = usePrefersReducedMotion();
  const [filter, setFilter] = useState("all");
  const {
    user,
    userId,
    loading: userLoading,
    isAuthenticated,
    error: userError,
  } = useCurrentUser();

  const stats = useQuery(
    api.commitments.weekStats,
    userId ? {} : "skip"
  );
  const todayCommitments = useQuery(
    api.commitments.listForToday,
    userId ? {} : "skip"
  );
  const todayTasks = useQuery(api.tasks.listForToday, userId ? {} : "skip");
  const boards = useQuery(api.pacts.listForUser, userId ? {} : "skip");
  const [dayStart] = useState(() => startOfLocalDayMs());
  const timeline = useQuery(
    api.activity.todayTimeline,
    userId ? { since: dayStart, limit: 12 } : "skip"
  );

  useEffect(() => {
    if (userLoading) return;
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    if (!user) return;
    // Pending local onboarding is applied during useCurrentUser bootstrap.
    // Don't bounce to /app/onboarding while that write is in flight / about to run.
    if (user.onboardingCompleted || readOnboardingPending()) return;
    router.replace("/app/onboarding");
  }, [isAuthenticated, user, userLoading, router]);

  const filteredCommitments = (todayCommitments ?? []).filter((c) => {
    if (filter === "blocked") {
      return c.status === "blocked" || c.status === "need_help";
    }
    if (filter === "pacts") {
      return Boolean(c.pactId);
    }
    return true;
  });

  const firstBlocked = (todayCommitments ?? []).find(
    (c) => c.status === "blocked" || c.status === "need_help"
  );
  const firstOpen = (todayCommitments ?? []).find(
    (c) => c.status !== "done" && c.status !== "paused"
  );
  const promptHref = firstBlocked
    ? `/app/commitments/${firstBlocked._id}`
    : (stats?.openCount ?? 0) === 0 && (todayTasks?.filter((t) => t.status === "open").length ?? 0) === 0
      ? "/app/new"
      : firstOpen
        ? `/app/commitments/${firstOpen._id}`
        : "/app/new";

  const filterOptions = filters.map((f) => ({
    ...f,
    count:
      f.id === "all"
        ? todayCommitments?.length
        : f.id === "blocked"
          ? todayCommitments?.filter(
              (c) => c.status === "blocked" || c.status === "need_help"
            ).length
          : todayCommitments?.filter((c) => Boolean(c.pactId)).length,
  }));

  if (userLoading) {
    return (
      <AppShell showTabs={false}>
        <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 text-white/70">
          <Loader2 className="size-6 animate-spin text-volt-500" />
          <p className="text-sm font-medium">Loading your pacts…</p>
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppShell showTabs={false}>
        <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-3 text-white/70">
          <Loader2 className="size-6 animate-spin text-volt-500" />
          <p className="text-sm font-medium">Taking you home…</p>
        </div>
      </AppShell>
    );
  }

  if (userError || !userId) {
    return (
      <AppShell showTabs={false}>
        <SurfaceCard tone="coral" className="mt-8">
          <p className="font-heading text-2xl font-bold">Account not ready</p>
          <p className="mt-2 text-sm opacity-80">
            {userError ?? "Could not load your Pact profile."}
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/sign-in">Try signing in again</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  const dataPending =
    stats === undefined ||
    todayCommitments === undefined ||
    todayTasks === undefined ||
    boards === undefined;

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between gap-3 pt-2">
        <div className="min-w-0">
          <RotatingPactTitle />
          <p className="mt-2 text-sm font-medium leading-snug text-white/65">
            Hello there
            {user?.displayName ? (
              <>
                , <span className="text-white/85">{user.displayName}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 items-center pt-1.5">
          <NotificationBell />
        </div>
      </header>

      {dataPending ? (
        <div className="mb-5 space-y-4" aria-busy aria-live="polite">
          <div className="h-36 animate-pulse rounded-[1.5rem] bg-white/6" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 animate-pulse rounded-[1.35rem] bg-white/6" />
            <div className="h-28 animate-pulse rounded-[1.35rem] bg-white/6" />
          </div>
          <p className="text-center text-xs font-medium text-white/65">
            Syncing your commitments…
          </p>
        </div>
      ) : (
        <>
          {(() => {
            const emptyHome =
              (todayCommitments?.length ?? 0) === 0 &&
              (todayTasks?.length ?? 0) === 0 &&
              (boards?.length ?? 0) === 0;
            if (!emptyHome) return null;
            return (
              <EmptyState
                className="mb-5"
                title="Start with one commitment"
                description="Add something due today: a personal task or a shared pact commitment. Keep it small."
                primaryAction={{ href: "/app/new", label: "Add commitment" }}
                secondaryAction={{
                  href: "/app/pacts/new",
                  label: "Create a Pact",
                }}
              />
            );
          })()}

          {(todayCommitments?.length ?? 0) > 0 ||
          (todayTasks?.length ?? 0) > 0 ||
          (boards?.length ?? 0) > 0 ? (
            <>
          <TodayPromptCard
            className="mb-5"
            people={
              boards?.[0]?.members?.slice(0, 1).map((m) => ({
                name: m.name,
                src: m.src,
              })) ?? [{ name: "Partner" }]
            }
            openCount={
              (stats?.openCount ?? 0) +
              (todayTasks?.filter((t) => t.status === "open").length ?? 0)
            }
            blockedCount={stats?.blockedCount ?? 0}
            weekCompleted={stats?.completedThisWeek ?? 0}
            href={promptHref}
          />

          <InstallPrompt className="mb-5" />

          <FilterChips
            options={filterOptions}
            value={filter}
            onChange={setFilter}
            className="mb-5"
          />

          <section className="mb-6">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Today&apos;s focus
              </h2>
              <span className="text-xs font-semibold text-white/65">
                {filteredCommitments.length} due
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredCommitments.length === 0 ? (
                <EmptyState
                  className="col-span-2"
                  size="md"
                  title="Nothing in focus"
                  description={
                    filter === "blocked"
                      ? "No blocked commitments right now."
                      : filter === "pacts"
                        ? "No pact commitments due today."
                        : "Add a commitment or personal task to fill today’s focus."
                  }
                  primaryAction={{ href: "/app/new", label: "Add commitment" }}
                  secondaryAction={{
                    href: "/app/pacts",
                    label: "Browse pacts",
                  }}
                />
              ) : (
                filteredCommitments.map((commitment, index) => {
                const span =
                  commitment.checklist?.length ||
                  index === filteredCommitments.length - 1
                    ? index === 0 && commitment.checklist
                      ? "col-span-1"
                      : commitment.checklist
                        ? "col-span-1"
                        : "col-span-2"
                    : "col-span-1";

                return (
                  <motion.div
                    key={commitment._id}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduceMotion ? { duration: 0 } : { delay: 0.05 * index }
                    }
                    className={
                      filteredCommitments.length === 1
                        ? "col-span-2"
                        : index === 2
                          ? "col-span-2"
                          : span
                    }
                  >
                    <CommitmentCard
                      title={commitment.title}
                      tone={commitment.tone ?? "cream"}
                      status={toUiStatus(commitment.status)}
                      meta={commitment.description}
                      items={commitment.checklist}
                      href={`/app/commitments/${commitment._id}`}
                    />
                  </motion.div>
                );
              })
              )}
            </div>
          </section>

          {filter === "all" && (todayTasks?.length ?? 0) > 0 ? (
            <section className="mb-6">
              <div className="mb-3 flex items-end justify-between">
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  Personal tasks
                </h2>
                <span className="text-xs font-semibold text-white/65">
                  {todayTasks?.length ?? 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(todayTasks ?? []).map((task, index) => (
                  <motion.div
                    key={task._id}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={reduceMotion ? { duration: 0 } : { delay: 0.04 * index }}
                    className={
                      (todayTasks?.length ?? 0) === 1
                        ? "col-span-2"
                        : "col-span-1"
                    }
                  >
                    <CommitmentCard
                      title={task.title}
                      tone={task.tone ?? "cream"}
                      status={task.status === "done" ? "done" : "on_track"}
                      meta={task.description}
                      href={`/app/tasks/${task._id}`}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          ) : null}

          {timeline !== undefined ? (
            <TodayTimeline items={timeline} className="mb-6" />
          ) : (
            <div
              className="mb-6 h-28 animate-pulse rounded-[1.5rem] bg-white/6"
              aria-hidden
            />
          )}

          <section className="mb-4">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Your pacts
              </h2>
              <span className="text-xs font-semibold text-signal">Boards</span>
            </div>
            <div className="space-y-3">
              {(boards ?? []).map((board) =>
                board ? (
                  <PactBoardCard
                    key={board.pact._id}
                    title={board.pact.title}
                    activeTasks={board.activeTasks}
                    members={board.members}
                    tone={board.pact.tone ?? "signal"}
                    href={`/app/pacts/${board.pact._id}`}
                    addHref={`/app/new?pactId=${board.pact._id}`}
                    inviteHref={`/app/pacts/${board.pact._id}#invite`}
                  />
                ) : null
              )}
            </div>
          </section>
            </>
          ) : null}
        </>
      )}
    </AppShell>
  );
}
