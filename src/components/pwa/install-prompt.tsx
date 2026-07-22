"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";

import { SurfaceCard } from "@/components/cards/surface-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "pact:install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPromptProps = {
  className?: string;
  force?: boolean;
};

export function InstallPrompt({ className, force = false }: InstallPromptProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

    setInstalled(standalone);

    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (installed) {
    if (!force) return null;
    return (
      <SurfaceCard tone="mint" className={cn("rounded-[1.75rem]", className)}>
        <p className="font-heading text-xl font-bold">Installed</p>
        <p className="mt-1 text-sm font-medium text-ink-950/75">
          Pact is running as a home-screen app on this device.
        </p>
      </SurfaceCard>
    );
  }

  if (!force && dismissed) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferred(null);
  }

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  return (
    <SurfaceCard tone="volt" className={cn("rounded-[1.75rem]", className)}>
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-ink-950/10">
          <Download className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-xl font-bold">Install Pact</p>
          <p className="mt-1 text-sm font-medium text-ink-950/75">
            Keep check-ins one tap away. No app store required.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {deferred ? (
              <Button
                type="button"
                onClick={install}
                className="h-10 rounded-full bg-ink-950 text-white"
              >
                Install
              </Button>
            ) : (
              <Button asChild className="h-10 rounded-full bg-ink-950 text-white">
                <Link href="/app/install">How to install</Link>
              </Button>
            )}
            {!force ? (
              <Button
                type="button"
                variant="ghost"
                onClick={dismiss}
                className="h-10 rounded-full border border-ink-950/15 text-ink-950"
              >
                Not now
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
