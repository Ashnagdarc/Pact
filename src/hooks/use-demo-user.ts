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
  // Don't spin forever when the session exists but Convex JWT auth never connects
  // (e.g. JWKS unreachable). Surface that as an error path instead.
  const loading =
    sessionPending ||
    convexAuthLoading ||
    (isAuthenticated && (!ready || appUser === undefined));

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
