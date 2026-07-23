"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

type CachedJwt = { token: string; expMs: number; userId: string };
let cachedJwt: CachedJwt | null = null;
let inflightJwt: Promise<string | null> | null = null;
let inflightUserId: string | null = null;

function jwtExpiryMs(token: string): number | null {
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function decodeJwtClaims(token: string): {
  iss?: unknown;
  aud?: unknown;
  sub?: unknown;
  alg?: unknown;
  kid?: unknown;
} | null {
  try {
    const [headerB64, payloadB64] = token.split(".");
    const header = JSON.parse(
      atob(headerB64.replace(/-/g, "+").replace(/_/g, "/"))
    );
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return {
      alg: header.alg,
      kid: header.kid,
      iss: payload.iss,
      aud: payload.aud,
      sub: payload.sub,
    };
  } catch {
    return null;
  }
}

/** Clear cached Convex JWT (call on sign-out / user change). */
export function clearConvexJwtCache() {
  cachedJwt = null;
  inflightJwt = null;
  inflightUserId = null;
}

async function fetchConvexJwt(
  userId: string,
  forceRefresh = false
): Promise<string | null> {
  const now = Date.now();
  // Reuse a valid token for ~50 minutes (tokens expire in 1h), keyed by user.
  if (
    !forceRefresh &&
    cachedJwt &&
    cachedJwt.userId === userId &&
    cachedJwt.expMs - now > 10 * 60 * 1000
  ) {
    return cachedJwt.token;
  }

  if (
    !forceRefresh &&
    inflightJwt &&
    inflightUserId === userId
  ) {
    return inflightJwt;
  }

  inflightUserId = userId;
  inflightJwt = (async () => {
    const response = await fetch("/api/convex-token", {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[pact-auth] /api/convex-token failed", response.status);
      }
      if (cachedJwt?.userId === userId) cachedJwt = null;
      return null;
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      if (cachedJwt?.userId === userId) cachedJwt = null;
      return null;
    }

    if (process.env.NODE_ENV !== "production") {
      console.info("[pact-auth] jwt claims", decodeJwtClaims(data.token));
    }

    const expMs = jwtExpiryMs(data.token) ?? now + 55 * 60 * 1000;
    cachedJwt = { token: data.token, expMs, userId };
    return data.token;
  })();

  try {
    return await inflightJwt;
  } finally {
    inflightJwt = null;
    inflightUserId = null;
  }
}

function useAuthFromBetterAuth() {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    if (!userId) {
      clearConvexJwtCache();
      return;
    }
    if (cachedJwt && cachedJwt.userId !== userId) {
      clearConvexJwtCache();
    }
  }, [userId]);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!userId) {
        clearConvexJwtCache();
        return null;
      }

      try {
        return await fetchConvexJwt(userId, forceRefreshToken);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[pact-auth] token fetch error", error);
        }
        return null;
      }
    },
    [userId]
  );

  return useMemo(
    () => ({
      isLoading: isPending,
      isAuthenticated,
      fetchAccessToken,
    }),
    [isPending, isAuthenticated, fetchAccessToken]
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromBetterAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
