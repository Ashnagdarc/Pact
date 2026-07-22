import Link from "next/link";

import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <AppShell showTabs={false}>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        Terms
      </h1>
      <p className="mt-2 text-sm text-white/55">
        Basic terms for the Pact private beta.
      </p>

      <SurfaceCard tone="ink" className="mt-6 border border-white/10 space-y-4 text-sm text-white/75">
        <p>
          Pact is an accountability product in active development. Features may
          change during beta.
        </p>
        <p>
          You’re responsible for the commitments and evidence you share with
          partners. Don’t upload illegal or harmful content.
        </p>
        <p>
          We aim to keep the service available, but beta downtime and data resets
          may happen. Keep your own copies of critical notes when needed.
        </p>
        <p>
          By using Pact you agree to the privacy practices described on the
          Privacy page.
        </p>
      </SurfaceCard>

      <Button asChild className="mt-4 rounded-full">
        <Link href="/app/profile">Back to profile</Link>
      </Button>
    </AppShell>
  );
}
