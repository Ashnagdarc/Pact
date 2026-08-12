"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Search } from "lucide-react";
import { useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { PactBoardCard } from "@/components/cards/pact-board-card";
import { SurfaceCard } from "@/components/cards/surface-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { AppShell } from "@/components/navigation/app-shell";
import { FilterChips } from "@/components/navigation/filter-chips";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-demo-user";

const statusFilters = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "paused", label: "Paused" },
];

export function PactsScreen() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <PactsScreenConnected />;
}

function PactsScreenConnected() {
  const { userId, loading, isAuthenticated } = useCurrentUser();
  const boards = useQuery(
    api.pacts.listForUser,
    userId ? {} : "skip"
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBoards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (boards ?? []).filter((board) => {
      if (!board) return false;
      if (statusFilter === "active" && board.pact.status !== "active") {
        return false;
      }
      if (statusFilter === "paused" && board.pact.status !== "paused") {
        return false;
      }
      if (q && !board.pact.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [boards, query, statusFilter]);

  const filterOptions = statusFilters.map((f) => ({
    ...f,
    count:
      f.id === "all"
        ? (boards ?? []).filter(Boolean).length
        : (boards ?? []).filter(
            (b) => b && b.pact.status === f.id
          ).length,
  }));

  if (loading || (userId && boards === undefined)) {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppShell>
        <SurfaceCard tone="volt" className="mt-8">
          <p className="font-heading text-2xl font-bold">Your Pacts</p>
          <p className="mt-2 text-sm opacity-80">
            Sign in to create boards and invite partners.
          </p>
          <Button asChild className="mt-4 rounded-full bg-ink-950 text-volt-500">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </SurfaceCard>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3 pt-2">
        <div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight">
            Pacts
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Shared boards with people who keep you honest.
          </p>
        </div>
        <Button
          asChild
          size="icon-lg"
          variant="soft"
        >
          <Link href="/app/pacts/new" aria-label="Create Pact">
            <Plus className="size-5" />
          </Link>
        </Button>
      </div>

      {(boards ?? []).length > 0 ? (
        <div className="mt-5 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title"
              className="h-11 rounded-2xl border-white/15 bg-white/5 pl-10 text-white"
              aria-label="Search pacts by title"
            />
          </div>
          <FilterChips
            options={filterOptions}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {(boards ?? []).length === 0 ? (
          <EmptyState
            title="Start your first Pact"
            description="Create a board, add commitments, and invite a partner to keep you accountable."
            primaryAction={{ href: "/app/pacts/new", label: "Create Pact" }}
          />
        ) : filteredBoards.length === 0 ? (
          <EmptyState
            size="md"
            title="No matching pacts"
            description={
              query.trim()
                ? `Nothing matches “${query.trim()}”.`
                : "Try another status filter."
            }
          />
        ) : (
          filteredBoards.map((board) =>
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
          )
        )}
      </div>
    </AppShell>
  );
}
