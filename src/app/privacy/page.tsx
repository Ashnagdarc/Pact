import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy — Pact",
  description: "How Pact handles your account, commitments, and evidence.",
};

export default function PrivacyPage() {
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
          Privacy
        </h1>
        <p className="mt-2 text-sm text-white/70">
          How Pact handles your account, commitments, and evidence.
        </p>

        <div className="mt-8 space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 text-sm leading-relaxed text-white/75">
          <p>
            Pact stores account authentication in Postgres (Better Auth) and app
            data in Convex. Evidence files (images/PDFs) are stored in Cloudflare
            R2; older uploads may still live in Convex file storage.
          </p>
          <p>
            Partners only see data inside Pacts you’ve invited them to. Personal
            tasks stay private to you.
          </p>
          <p>
            You can delete your account from Profile. That removes your Convex
            app data and your auth account.
          </p>
          <p>
            Push notifications are optional. Subscriptions are stored only when
            you enable alerts.
          </p>
        </div>

        <Button asChild className="mt-6 rounded-full">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
    </div>
  );
}
