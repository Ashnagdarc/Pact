"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { LayoutGrid, Loader2 } from "lucide-react";
import { motion } from "motion/react";

import { api } from "@convex/_generated/api";
import { CommitmentCard } from "@/components/cards/commitment-card";
import { PactBoardCard } from "@/components/cards/pact-board-card";
import { StatHero } from "@/components/cards/stat-hero";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AvatarStack } from "@/components/feedback/avatar-stack";
import { AppShell } from "@/components/navigation/app-shell";
import { FilterChips } from "@/components/navigation/filter-chips";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { WelcomeScreen } from "@/components/screens/welcome-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { readOnboardingPending } from "@/lib/onboarding";
import type { CommitmentStatus } from "@/lib/status";

const filters = [
  { id: "all", label: "All" },
  { id: "pacts", label: "Pacts" },
  { id: "due", label: "Due today" },
  { id: "blocked", label: "Blocked" },
];

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
  const boards = useQuery(api.pacts.listForUser, userId ? {} : "skip");

  useEffect(() => {
    if (!isAuthenticated || userLoading || !user) return;
    // Pending local onboarding is applied during useCurrentUser bootstrap.
    // Don't bounce to /onboarding while that write is in flight / about to run.
    if (!user.onboardingCompleted && !readOnboardingPending()) {
      router.replace("/onboarding");
    }
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

  const filterOptions = filters.map((f) => ({
    ...f,
    count:
      f.id === "all"
        ? todayCommitments?.length
        : f.id === "due"
          ? todayCommitments?.length
          : f.id === "blocked"
            ? todayCommitments?.filter(
                (c) => c.status === "blocked" || c.status === "need_help"
              ).length
            : boards?.length,
  }));

  if (userLoading || (userId && (!stats || !todayCommitments || !boards))) {
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
    return <WelcomeScreen />;
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

  return (
    <AppShell>
      <header className="mb-5 flex items-start justify-between gap-3 pt-2">
        <div>
          <p className="text-sm font-medium text-white/55">
            Hello, {user?.displayName ?? "there"}
          </p>
          <h1 className="font-heading text-[2.6rem] leading-none font-extrabold tracking-tight">
            Pact
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            size="icon"
            variant="ghost"
            className="size-11 rounded-full border border-white/10 bg-white/5"
            aria-label="Layout"
          >
            <LayoutGrid className="size-5" />
          </Button>
        </div>
      </header>

      <SurfaceCard tone="glass" className="mb-4 flex items-center gap-3 py-3">
        <AvatarStack
          people={boards?.[0]?.members?.slice(0, 1) ?? [{ name: "Partner" }]}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">What are you doing today?</p>
          <p className="truncate text-xs text-white/55">
            {stats?.openCount ?? 0} open · {stats?.blockedCount ?? 0} need attention
          </p>
        </div>
      </SurfaceCard>

      <StatHero
        value={stats?.completedThisWeek ?? 0}
        label="Commitments kept this week. Keep the streak kind."
        className="mb-5"
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
          <span className="text-xs font-semibold text-white/45">
            {filteredCommitments.length} due
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredCommitments.map((commitment, index) => {
            const span =
              commitment.checklist?.length || index === filteredCommitments.length - 1
                ? index === 0 && commitment.checklist
                  ? "col-span-1"
                  : commitment.checklist
                    ? "col-span-1"
                    : "col-span-2"
                : "col-span-1";

            return (
              <motion.div
                key={commitment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
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
                  favorited={commitment.favorited}
                  status={toUiStatus(commitment.status)}
                  meta={commitment.description}
                  items={commitment.checklist}
                  href={`/commitments/${commitment._id}`}
                />
              </motion.div>
            );
          })}
        </div>
      </section>

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
                href={`/pacts/${board.pact._id}`}
                addHref={`/new?pactId=${board.pact._id}`}
              />
            ) : null
          )}
        </div>
      </section>
    </AppShell>
  );
}
