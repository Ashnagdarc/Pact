"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Bell, BellOff, Loader2 } from "lucide-react";

import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/use-push-subscription";

export function PushOptInButton({
  hasSubscription,
}: {
  hasSubscription?: boolean;
}) {
  const { enablePush, disablePush } = usePushSubscription();
  const mine = useQuery(api.pushSubscriptions.listMine);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/65">
        Push keys are not configured yet. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and
        Convex `VAPID_*` env vars.
      </p>
    );
  }

  const enabled = hasSubscription ?? (mine?.length ?? 0) > 0;

  async function onToggle() {
    setBusy(true);
    setMessage(null);
    try {
      if (enabled) {
        await disablePush();
        setMessage("Push alerts disabled");
      } else {
        await enablePush();
        setMessage("Push alerts enabled");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update push"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="secondary"
        disabled={busy}
        onClick={() => void onToggle()}
        className="h-11 justify-start gap-2 rounded-2xl"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : enabled ? (
          <BellOff className="size-4" />
        ) : (
          <Bell className="size-4" />
        )}
        {enabled ? "Disable push alerts" : "Enable push alerts"}
      </Button>
      {message ? <p className="text-xs text-white/50">{message}</p> : null}
    </div>
  );
}
