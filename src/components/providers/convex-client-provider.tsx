"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { useCallback, useMemo, type ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

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

async function fetchConvexJwt(): Promise<string | null> {
  // Same-origin issuer with typ/iss/aud Convex expects (not Better Auth /token).
  const response = await fetch("/api/convex-token", {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[pact-auth] /api/convex-token failed", response.status);
    }
    return null;
  }

  const data = (await response.json()) as { token?: string };
  if (!data.token) {
    return null;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[pact-auth] jwt claims", decodeJwtClaims(data.token));
  }

  return data.token;
}

function useAuthFromBetterAuth() {
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!session?.user) {
        return null;
      }

      void forceRefreshToken;
      try {
        return await fetchConvexJwt();
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[pact-auth] token fetch error", error);
        }
        return null;
      }
    },
    [session?.user]
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
