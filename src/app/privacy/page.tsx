import Link from "next/link";

import { SurfaceCard } from "@/components/cards/surface-card";
import { AppShell } from "@/components/navigation/app-shell";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  return (
    <AppShell showTabs={false}>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        Privacy
      </h1>
      <p className="mt-2 text-sm text-white/55">
        How Pact handles your account, commitments, and evidence.
      </p>

      <SurfaceCard tone="ink" className="mt-6 border border-white/10 space-y-4 text-sm text-white/75">
        <p>
          Pact stores account authentication in Postgres (Better Auth) and app
          data in Convex. Evidence files use Convex file storage.
        </p>
        <p>
          Partners only see data inside Pacts you’ve invited them to. Personal
          tasks stay private to you.
        </p>
        <p>
          You can delete your account from Profile. That removes your Convex app
          data and your auth account.
        </p>
        <p>
          Push notifications are optional. Subscriptions are stored only when you
          enable alerts.
        </p>
      </SurfaceCard>

      <Button asChild className="mt-4 rounded-full">
        <Link href="/profile">Back to profile</Link>
      </Button>
    </AppShell>
  );
}
