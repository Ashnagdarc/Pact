"use client";

import { Mic, Plus } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type FabClusterProps = {
  className?: string;
};

export function FabCluster({ className }: FabClusterProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto flex w-full max-w-md justify-center gap-3 px-6",
        className
      )}
    >
      <Link
        href="/new"
        aria-label="Create commitment"
        className="pointer-events-auto inline-flex size-16 items-center justify-center rounded-full bg-ink-950 text-white shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-2 ring-white/10 transition-transform active:scale-95"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </Link>
      <button
        type="button"
        aria-label="Voice check-in"
        className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition-transform active:scale-95"
      >
        <Mic className="size-5" />
      </button>
    </div>
  );
}
