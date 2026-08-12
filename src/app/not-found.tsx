import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="content"
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-ink-950 px-5 text-center text-paper-100"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,82,38,0.16),_transparent_55%)]"
      />
      <div className="relative mx-auto w-full max-w-md">
        <p className="font-heading text-5xl font-extrabold tracking-tight text-volt-500">
          Pact
        </p>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-white/70">
          That link doesn&apos;t match anything in the app.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            className="h-12 rounded-full bg-volt-500 px-6 font-semibold text-white hover:bg-volt-500/90"
          >
            <Link href="/app">Go to Today</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-12 rounded-full border border-white/15"
          >
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
