"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/hooks/use-push-subscription";

export function PushOptInButton() {
  const { enablePush } = usePushSubscription();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return null;
  }

  async function onEnable() {
    setBusy(true);
    setMessage(null);
    try {
      await enablePush();
      setMessage("Push alerts enabled");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable push");
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
        onClick={() => void onEnable()}
        className="h-11 justify-start gap-2 rounded-2xl"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        Enable push alerts
      </Button>
      {message ? <p className="text-xs text-white/50">{message}</p> : null}
    </div>
  );
}
