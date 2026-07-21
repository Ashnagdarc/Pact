import { AppShell } from "@/components/navigation/app-shell";
import { SurfaceCard } from "@/components/cards/surface-card";

export default function OfflinePage() {
  return (
    <AppShell showTabs={false}>
      <h1 className="font-heading pt-2 text-4xl font-extrabold tracking-tight">
        You&apos;re offline
      </h1>
      <SurfaceCard tone="volt" className="mt-6 rounded-[2rem]">
        <p className="font-heading text-2xl font-bold">Pact will sync when you&apos;re back</p>
        <p className="mt-2 text-sm font-medium text-ink-950/75">
          Recently opened screens may still work. New check-ins will need a connection for now.
        </p>
      </SurfaceCard>
    </AppShell>
  );
}
