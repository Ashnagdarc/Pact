"use client";

import Link from "next/link";
import { Share, Smartphone } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function InstallPage() {
  return (
    <AppShell>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        Install Pact
      </h1>
      <p className="mt-2 text-sm text-white/55">
        Add it to your home screen for a faster, app-like check-in loop.
      </p>

      <InstallPrompt className="mt-6" force />

      <SurfaceCard tone="ink" className="mt-4 border border-white/10">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-white/5">
            <Smartphone className="size-5" />
          </span>
          <div>
            <p className="font-heading text-lg font-bold">iPhone (Safari)</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-white/70">
              <li>Open Pact in Safari</li>
              <li>
                Tap <Share className="mx-1 inline size-3.5" /> Share
              </li>
              <li>Tap Add to Home Screen</li>
              <li>Open the installed app</li>
              <li>Enable notifications when prompted</li>
            </ol>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard tone="cream" className="mt-4">
        <p className="font-heading text-lg font-bold text-ink-950">Android (Chrome)</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm font-medium text-ink-950/75">
          <li>Open the menu (⋮)</li>
          <li>Tap Install app / Add to Home screen</li>
          <li>Confirm Install</li>
        </ol>
      </SurfaceCard>

      <Button asChild className="mt-6 h-12 w-full rounded-full bg-signal text-ink-950">
        <Link href="/app">Back to Today</Link>
      </Button>
    </AppShell>
  );
}
