"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/use-demo-user";

const POST_ONBOARDING_PATH_KEY = "pact.postOnboardingPath";

function readPendingPath() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(POST_ONBOARDING_PATH_KEY);
    return value?.startsWith("/") && !value.startsWith("//") ? value : null;
  } catch {
    return null;
  }
}

function clearPendingPath() {
  try {
    window.sessionStorage.removeItem(POST_ONBOARDING_PATH_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function PostOnboardingRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading } = useCurrentUser();

  useEffect(() => {
    if (loading || !isAuthenticated || !user?.onboardingCompleted) return;
    if (pathname !== "/") return;

    const destination = readPendingPath();
    if (!destination || destination === "/") return;

    clearPendingPath();
    router.replace(destination);
  }, [isAuthenticated, loading, pathname, router, user?.onboardingCompleted]);

  return null;
}
