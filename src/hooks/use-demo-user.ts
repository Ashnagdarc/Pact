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

export function useCurrentUser() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { isAuthenticated: convexAuthenticated, isLoading: convexAuthLoading } =
    useConvexAuth();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingPending, setApplyingPending] = useState(false);
  const bootGen = useRef(0);

  const ensureAppUser = useMutation(api.users.ensureAppUser);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const appUser = useQuery(
    api.users.getCurrent,
    convexAuthenticated ? {} : "skip"
  );

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
      if (sessionPending || convexAuthLoading) {
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
  ]);

  const signOut = useCallback(async () => {
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

  const loading =
    sessionPending ||
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
