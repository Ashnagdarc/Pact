import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main
      id="content"
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ink-950 text-white/70"
    >
      <Loader2 className="size-6 animate-spin text-volt-500" />
      <p className="text-sm font-medium">Loading Pact…</p>
    </main>
  );
}
