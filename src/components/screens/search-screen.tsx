"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { Loader2, Search } from "lucide-react";

import { api } from "@convex/_generated/api";
import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { ConvexSetupScreen } from "@/components/screens/convex-setup-screen";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/hooks/use-demo-user";

function matches(haystack: string | undefined | null, q: string) {
  if (!haystack) return false;
  return haystack.toLowerCase().includes(q);
}

export function SearchScreen() {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexSetupScreen />;
  }
  return <SearchConnected />;
}

function SearchConnected() {
  const { userId, loading } = useCurrentUser();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const commitments = useQuery(
    api.commitments.listForAssignee,
    userId ? {} : "skip"
  );
  const tasks = useQuery(api.tasks.listMine, userId ? {} : "skip");
  const boards = useQuery(api.pacts.listForUser, userId ? {} : "skip");

  const results = useMemo(() => {
    if (!q) return { pacts: [], commitments: [], tasks: [] };

    const pactHits = (boards ?? [])
      .filter((b): b is NonNullable<typeof b> => Boolean(b))
      .filter(
        (b) =>
          matches(b.pact.title, q) || matches(b.pact.description, q)
      )
      .map((b) => ({
        id: b.pact._id,
        title: b.pact.title,
        href: `/app/pacts/${b.pact._id}`,
        meta: b.pact.status,
      }));

    const commitmentHits = (commitments ?? [])
      .filter((c) => matches(c.title, q) || matches(c.description, q))
      .slice(0, 40)
      .map((c) => ({
        id: c._id,
        title: c.title,
        href: `/app/commitments/${c._id}`,
        meta: c.status.replaceAll("_", " "),
      }));

    const taskHits = (tasks ?? [])
      .filter((t) => matches(t.title, q) || matches(t.description, q))
      .slice(0, 20)
      .map((t) => ({
        id: t._id,
        title: t.title,
        href: `/app/tasks/${t._id}`,
        meta: t.status,
      }));

    return { pacts: pactHits, commitments: commitmentHits, tasks: taskHits };
  }, [boards, commitments, q, tasks]);

  const total =
    results.pacts.length + results.commitments.length + results.tasks.length;

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[50dvh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-volt-500" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        Search
      </h1>
      <p className="mt-2 text-sm text-white/55">
        Find pacts, commitments, and tasks.
      </p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a title or keyword"
          className="h-12 rounded-2xl border-white/15 bg-white/5 pl-10 text-white"
          autoFocus
        />
      </div>

      {!q ? (
        <SurfaceCard tone="ink" className="mt-5 border border-white/10">
          <p className="text-sm text-white/55">
            Search matches titles and notes across your boards.
          </p>
        </SurfaceCard>
      ) : commitments === undefined || tasks === undefined || boards === undefined ? (
        <div className="mt-8 flex justify-center">
          <Loader2 className="size-5 animate-spin text-volt-500" />
        </div>
      ) : total === 0 ? (
        <SurfaceCard tone="ink" className="mt-5 border border-white/10">
          <p className="text-sm text-white/55">No matches for “{query.trim()}”.</p>
        </SurfaceCard>
      ) : (
        <div className="mt-5 space-y-5">
          {results.pacts.length > 0 ? (
            <ResultGroup label="Pacts" items={results.pacts} />
          ) : null}
          {results.commitments.length > 0 ? (
            <ResultGroup label="Commitments" items={results.commitments} />
          ) : null}
          {results.tasks.length > 0 ? (
            <ResultGroup label="Tasks" items={results.tasks} />
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function ResultGroup({
  label,
  items,
}: {
  label: string;
  items: { id: string; title: string; href: string; meta: string }[];
}) {
  return (
    <section>
      <h2 className="mb-2 font-heading text-xl font-bold tracking-tight">
        {label}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/8"
            >
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-0.5 text-xs capitalize text-white/55">
                {item.meta}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
