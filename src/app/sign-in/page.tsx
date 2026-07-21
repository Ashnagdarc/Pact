import { Suspense } from "react";
import SignInPage from "./sign-in-form";

export default function SignInRoute() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-ink-950 text-white/60">
          Loading…
        </main>
      }
    >
      <SignInPage />
    </Suspense>
  );
}
