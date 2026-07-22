"use client";

import Link from "next/link";
import { Loader2, Plus } from "lucide-react";
import { useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import { PactBoardCard } from "@/components/cards/pact-board-card";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";

export function PactsScreen() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }

  return <PactsScreenConnected />;
}

function PactsScreenConnected() {
  const { userId, user, loading, isAuthenticated } = useCurrentUser();
  const boards = useQuery(
    api.pacts.listForUser,
    userId ? {} : "skip"
  );

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
            Signed in as {user?.displayName ?? "you"}
          </p>
        </div>
        <Button
          asChild
          size="icon"
          className="size-11 rounded-full bg-signal text-white hover:bg-signal/90"
        >
          <Link href="/app/pacts/new" aria-label="Create Pact">
            <Plus className="size-5" />
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {(boards ?? []).length === 0 ? (
          <SurfaceCard tone="ink" className="border border-white/10">
            <p className="text-sm text-white/70">
              No pacts yet. Create one and share an invite link.
            </p>
            <Button asChild className="mt-3 rounded-full bg-signal text-white">
              <Link href="/app/pacts/new">Create Pact</Link>
            </Button>
          </SurfaceCard>
        ) : (
          boards!.map((board) =>
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
