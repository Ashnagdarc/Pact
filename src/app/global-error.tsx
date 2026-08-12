"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full bg-ink-950 font-sans text-paper-100 antialiased">
        <main
          id="content"
          className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 text-center"
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
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Try again, or head back to Today.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                type="button"
                onClick={reset}
                className="h-12 rounded-full bg-volt-500 px-6 font-semibold text-white hover:bg-volt-500/90"
              >
                Try again
              </Button>
              <Button
                asChild
                variant="ghost"
                className="h-12 rounded-full border border-white/15"
              >
                <Link href="/app">Go to Today</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
