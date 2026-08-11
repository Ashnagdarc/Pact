"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Registers the service worker, detects waiting updates after a Vercel deploy,
 * and shows an app-like "Update" banner so users can refresh into the new build.
 */
export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const [updating, setUpdating] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const refreshingRef = useRef(false);

  const promptUpdate = useCallback(() => {
    setUpdateReady(true);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const allowDev =
      process.env.NODE_ENV !== "production" &&
      Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
    if (process.env.NODE_ENV !== "production" && !allowDev) return;

    let cancelled = false;
    let removeVisibility: (() => void) | undefined;
    let intervalId: number | undefined;

    function watchWorker(worker: ServiceWorker | null) {
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (cancelled) return;
        if (worker.state !== "installed") return;
        // First install: no active controller yet - activate quietly.
        if (!navigator.serviceWorker.controller) {
          worker.postMessage({ type: "SKIP_WAITING" });
          return;
        }
        // Update while the app is already controlled - ask the user.
        promptUpdate();
      });
    }

    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (cancelled) return;
        registrationRef.current = registration;

        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate();
        }

        registration.addEventListener("updatefound", () => {
          watchWorker(registration.installing);
        });

        const onVisibility = () => {
          if (document.visibilityState === "visible") {
            void registration.update();
          }
        };
        document.addEventListener("visibilitychange", onVisibility);
        removeVisibility = () => {
          document.removeEventListener("visibilitychange", onVisibility);
        };

        intervalId = window.setInterval(() => {
          void registration.update();
        }, 15 * 60 * 1000);
      })
      .catch(() => {
        // Silent - SW is progressive enhancement
      });

    const onControllerChange = () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    return () => {
      cancelled = true;
      removeVisibility?.();
      if (intervalId !== undefined) window.clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
    };
  }, [promptUpdate]);

  function applyUpdate() {
    const waiting = registrationRef.current?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    setUpdating(true);
    waiting.postMessage({ type: "SKIP_WAITING" });
  }

  if (!updateReady) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "safe-pb pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md px-4",
        // Sit above the floating tab bar
        "mb-[5.75rem]"
      )}
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-[1.5rem] border border-white/15 bg-ink-900/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Update available</p>
          <p className="mt-0.5 text-xs text-white/55">
            A newer version of Pact is ready.
          </p>
        </div>
        <Button
          type="button"
          disabled={updating}
          onClick={applyUpdate}
          className="h-10 shrink-0 rounded-full bg-volt-500 px-4 text-sm font-bold text-white hover:bg-volt-500/90"
        >
          {updating ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="size-4" />
              Update
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
