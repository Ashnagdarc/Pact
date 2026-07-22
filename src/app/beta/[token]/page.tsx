"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function BetaAccessPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const token = params.token?.trim();
    if (!token) {
      setError("Invalid access link");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/beta/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Invalid or used invite link");
        }
        router.replace("/sign-in?mode=sign-up&beta=1");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open invite");
      }
    });
  }, [params.token, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-950 px-5 text-paper-100">
      <div className="max-w-sm text-center">
        {error ? (
          <>
            <p className="font-heading text-2xl font-bold">Invite unavailable</p>
            <p className="mt-2 text-sm text-white/55">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-6 animate-spin text-volt-500" />
            <p className="mt-4 text-sm text-white/55">
              {pending ? "Unlocking your early beta access…" : "Preparing…"}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
