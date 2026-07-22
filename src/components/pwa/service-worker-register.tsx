"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Register in production always; also in development when push is configured.
    const allowDev =
      process.env.NODE_ENV !== "production" &&
      Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
    if (process.env.NODE_ENV !== "production" && !allowDev) return;

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silent — SW is progressive enhancement
    });
  }, []);

  return null;
}
