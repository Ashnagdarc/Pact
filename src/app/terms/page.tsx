import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms — Pact",
  description: "Basic terms for the Pact private beta.",
};

export default function TermsPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-ink-950 text-paper-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[40vh] bg-[radial-gradient(ellipse_at_20%_0%,_rgba(255,247,104,0.12),_transparent_55%),linear-gradient(180deg,_#050505_0%,_#0a101c_70%,_#050505_100%)]"
      />
      <header className="relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 pt-5 safe-pt sm:px-8">
        <Link
          href="/"
          className="font-heading text-xl font-extrabold tracking-tight text-volt-500"
        >
          Pact
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold text-white/70 hover:text-white"
        >
          Back to home
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 py-12 sm:px-8">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight">
          Terms
        </h1>
        <p className="mt-2 text-sm text-white/70">
          Basic terms for the Pact private beta.
        </p>

        <div className="mt-8 space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-sm leading-relaxed text-white/75">
          <p>
            Pact is an accountability product in active development. Features may
            change during beta.
          </p>
          <p>
            You’re responsible for the commitments and evidence you share with
            partners. Don’t upload illegal or harmful content.
          </p>
          <p>
            We aim to keep the service available, but beta downtime and data
            resets may happen. Keep your own copies of critical notes when
            needed.
          </p>
          <p>
            By using Pact you agree to the privacy practices described on the
            Privacy page.
          </p>
        </div>

        <Button asChild className="mt-6 rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </div>
  );
}
