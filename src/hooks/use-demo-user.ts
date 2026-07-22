"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { authClient } from "@/lib/auth-client";
import {
  clearOnboardingDraft,
  clearOnboardingPending,
  readOnboardingPending,
} from "@/lib/onboarding";

const SESSION_HINT_KEY = "pact.hasSession";

function readSessionHint() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSessionHint(hasSession: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (hasSession) {
      window.sessionStorage.setItem(SESSION_HINT_KEY, "1");
    } else {
      window.sessionStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

export function useCurrentUser() {
  const {
    data: session,
    isPending: sessionPending,
    isRefetching: sessionRefetching,
  } = authClient.useSession();
  const { isAuthenticated: convexAuthenticated, isLoading: convexAuthLoading } =
    useConvexAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingPending, setApplyingPending] = useState(false);
  const [sessionHint, setSessionHint] = useState(false);
  // Keep SSR + first client paint on the same loading shell. Session state from
  // Better Auth can resolve differently on the server vs the client's first render.
  const [hydrated, setHydrated] = useState(false);
  const bootGen = useRef(0);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const ensureAppUser = useMutation(api.users.ensureAppUser);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const appUser = useQuery(
    api.users.getCurrent,
    convexAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    setSessionHint(readSessionHint());
  }, []);

  // Remember that this tab had a session so brief refetches don't flash Welcome.
  useEffect(() => {
    if (sessionPending || sessionRefetching) return;
    const hasSession = Boolean(session?.user);
    writeSessionHint(hasSession);
    setSessionHint(hasSession);
  }, [session?.user, sessionPending, sessionRefetching]);

  // Clear local pending only after Convex reflects onboardingCompleted.
  useEffect(() => {
    if (!appUser?.onboardingCompleted) return;
    if (!readOnboardingPending()) {
      setApplyingPending(false);
      return;
    }
    clearOnboardingPending();
    clearOnboardingDraft();
    setApplyingPending(false);
  }, [appUser?.onboardingCompleted]);

  useEffect(() => {
    const gen = ++bootGen.current;
    let cancelled = false;

    async function bootstrap() {
      if (sessionPending || sessionRefetching || convexAuthLoading) {
        setReady(false);
        return;
      }

      if (!session?.user) {
        if (!cancelled && gen === bootGen.current) {
          setReady(true);
          setApplyingPending(false);
          setError(null);
        }
        return;
      }

      // Session exists but Convex JWT not ready — stay loading.
      if (!convexAuthenticated) {
        setReady(false);
        return;
      }

      try {
        await ensureAppUser({});

        const pending = readOnboardingPending();
        if (pending) {
          if (!cancelled && gen === bootGen.current) {
            setApplyingPending(true);
          }
          await completeOnboarding({
            displayName: pending.displayName.trim() || undefined,
            goalFocus: pending.goalFocus,
            defaultAccountabilityStyle: pending.accountabilityStyle,
            defaultCheckInFrequency: pending.checkInFrequency,
          });
          // Keep pending in localStorage until appUser.onboardingCompleted
          // flips true (see effect above). Prevents Today from redirecting
          // to /onboarding on a stale query snapshot.
        }

        if (!cancelled && gen === bootGen.current) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && gen === bootGen.current) {
          setApplyingPending(false);
          setError(
            err instanceof Error ? err.message : "Failed to load your account"
          );
          setReady(true);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [
    completeOnboarding,
    convexAuthLoading,
    convexAuthenticated,
    ensureAppUser,
    session,
    sessionPending,
    sessionRefetching,
  ]);

  const signOut = useCallback(async () => {
    writeSessionHint(false);
    setSessionHint(false);
    await authClient.signOut();
  }, []);

  const isAuthenticated = Boolean(session?.user) && convexAuthenticated;
  const waitingForConvex =
    Boolean(session?.user) && (convexAuthLoading || !convexAuthenticated);
  const waitingForUserRow = isAuthenticated && (!ready || appUser == null);
  const waitingForPendingOnboarding =
    isAuthenticated &&
    applyingPending &&
    appUser != null &&
    !appUser.onboardingCompleted;
  // Avoid treating a transient null session (or in-flight refetch) as logged out.
  const waitingForSessionSettlement =
    sessionPending ||
    sessionRefetching ||
    (sessionHint && !session?.user);

  const loading =
    !hydrated ||
    waitingForSessionSettlement ||
    waitingForConvex ||
    waitingForUserRow ||
    waitingForPendingOnboarding;

  return {
    user: appUser ?? null,
    userId: (appUser?._id ?? null) as Id<"users"> | null,
    isAuthenticated,
    isDemoOwner: false,
    ready,
    error:
      error ??
      (Boolean(session?.user) &&
      !convexAuthLoading &&
      !convexAuthenticated &&
      ready
        ? "Signed in, but Convex could not verify your session token. Check auth JWKS / issuer config."
        : null),
    loading,
    signOut,
    setSessionUser: (_userId: Id<"users">) => undefined,
    clearSessionUser: signOut,
  };
}

/** @deprecated Prefer useCurrentUser */
export function useDemoUser() {
  return useCurrentUser();
}
