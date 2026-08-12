"use client";

import { useEffect } from "react";

/**
 * Syncs the installed PWA / home-screen badge with unread count.
 * No-ops when Badging API is unavailable.
 */
export function useAppBadge(unread: number | undefined) {
  useEffect(() => {
    if (typeof unread !== "number") return;
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };

    void (async () => {
      try {
        if (unread <= 0) {
          await nav.clearAppBadge?.();
          return;
        }
        await nav.setAppBadge?.(unread);
      } catch {
        // Unsupported or permission denied — ignore.
      }
    })();
  }, [unread]);
}
