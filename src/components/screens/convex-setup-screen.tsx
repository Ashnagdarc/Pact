import { AppShell } from "@/components/navigation/app-shell";
import { SurfaceCard } from "@/components/cards/surface-card";

export function ConvexSetupScreen() {
  return (
    <AppShell showTabs={false}>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        Pact
      </h1>
      <SurfaceCard tone="volt" className="mt-6 rounded-[2rem]">
        <p className="font-heading text-2xl font-bold">Connect Convex</p>
        <p className="mt-2 text-sm font-medium text-ink-950/75">
          The UI framework is ready. Link a Convex deployment to load live
          commitments and pacts.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-medium text-ink-950/80">
          <li>
            Run <code className="rounded bg-black/10 px-1.5 py-0.5">npx convex dev</code>
          </li>
          <li>Create or select the Pact project when prompted</li>
          <li>Refresh this page once `.env.local` has `NEXT_PUBLIC_CONVEX_URL`</li>
        </ol>
      </SurfaceCard>
    </AppShell>
  );
}
