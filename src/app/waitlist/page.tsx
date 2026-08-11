"use client";

import { useEffect } from "react";

/** Old /waitlist route - send people to the landing waitlist form. */
export default function WaitlistRedirectPage() {
  useEffect(() => {
    window.location.replace("/#waitlist");
  }, []);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-950 text-sm text-white/50">
      Taking you to private beta access…
    </main>
  );
}
