import { Suspense } from "react";

import { PactDetailScreen } from "@/components/screens/pact-detail-screen";
import { AppShell } from "@/components/navigation/app-shell";
import { Loader2 } from "lucide-react";

type PactPageProps = {
  params: Promise<{ pactId: string }>;
};

export default async function PactPage({ params }: PactPageProps) {
  const { pactId } = await params;

  return (
    <Suspense
      fallback={
        <AppShell showTabs={false}>
          <div className="flex min-h-[60dvh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-volt-500" />
          </div>
        </AppShell>
      }
    >
      <PactDetailScreen pactId={pactId} />
    </Suspense>
  );
}
