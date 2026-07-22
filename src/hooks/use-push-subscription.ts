"use client";

import { useMutation } from "convex/react";

import { api } from "@convex/_generated/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function usePushSubscription() {
  const upsert = useMutation(api.pushSubscriptions.upsert);
  const remove = useMutation(api.pushSubscriptions.remove);

  async function enablePush() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      throw new Error("Push is not supported in this browser");
    }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error("Push is not configured");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission denied");
    }

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      throw new Error("Invalid push subscription");
    }

    await upsert({
      endpoint: json.endpoint,
      expirationTime: json.expirationTime ?? undefined,
      keys: {
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      },
      userAgent: navigator.userAgent,
    });

    return subscription;
  }

  async function disablePush() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    await remove({ endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  }

  return { enablePush, disablePush };
}
