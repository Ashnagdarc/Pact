"use client";

import { useCallback, useEffect, useState } from "react";
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

  const ensureAppUser = useMutation(api.users.ensureAppUser);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const appUser = useQuery(
    api.users.getCurrent,
    convexAuthenticated ? {} : "skip"
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (sessionPending || convexAuthLoading) {
        return;
      }

      if (!session?.user || !convexAuthenticated) {
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
        return;
      }

      try {
        await ensureAppUser({});

        const pending = readOnboardingPending();
        if (pending) {
          await completeOnboarding({
            displayName: pending.displayName.trim() || undefined,
            goalFocus: pending.goalFocus,
            defaultAccountabilityStyle: pending.accountabilityStyle,
            defaultCheckInFrequency: pending.checkInFrequency,
          });
          clearOnboardingPending();
          clearOnboardingDraft();
        }

        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
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
  const loading =
    sessionPending ||
    convexAuthLoading ||
    (Boolean(session?.user) && (!ready || appUser === undefined));

  return {
    user: appUser ?? null,
    userId: (appUser?._id ?? null) as Id<"users"> | null,
    isAuthenticated,
    isDemoOwner: false,
    ready,
    error,
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
