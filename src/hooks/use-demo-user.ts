"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureAppUser = useMutation(api.users.ensureAppUser);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const authUserId = session?.user?.id ?? null;

  const appUser = useQuery(
    api.users.getByAuthUserId,
    authUserId ? { authUserId } : "skip"
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (sessionPending) {
        return;
      }

      if (!session?.user) {
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
        return;
      }

      try {
        const userId = await ensureAppUser({
          authUserId: session.user.id,
          email: session.user.email,
          displayName:
            session.user.name ||
            session.user.email.split("@")[0] ||
            "Pact user",
          avatarUrl: session.user.image ?? undefined,
        });

        const pending = readOnboardingPending();
        if (pending) {
          await completeOnboarding({
            userId,
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
  }, [completeOnboarding, ensureAppUser, session, sessionPending]);

  const signOut = useCallback(async () => {
    await authClient.signOut();
  }, []);

  const isAuthenticated = Boolean(session?.user);
  const loading =
    sessionPending ||
    (isAuthenticated && (!ready || appUser === undefined));

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
