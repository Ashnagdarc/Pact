"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { motion } from "motion/react";

import { LandingBetaForm } from "@/components/landing/landing-beta-form";
import { LandingDynamicHeadline } from "@/components/landing/landing-dynamic-headline";
import { LandingHeroDevice } from "@/components/landing/landing-hero-device";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-demo-user";

const steps = [
  {
    title: "Make a Pact",
    description:
      "Agree on the goal, deadline, check-in schedule, and the support you need.",
  },
  {
    title: "Show your progress",
    description:
      "Send a quick status, attach proof when it helps, and say when you are blocked.",
  },
  {
    title: "Recover together",
    description:
      "Turn missed commitments into realistic rescue plans instead of abandoned goals.",
  },
] as const;

const differentiators = [
  "Accountability Agreements",
  "Five-second check-ins",
  "Pact Health",
  "Rescue Mode",
  "Weekly reviews",
  "Privacy controls",
] as const;

export function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useCurrentUser();

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    router.replace("/app");
  }, [isAuthenticated, loading, router]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-ink-950 text-paper-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[100dvh] bg-[radial-gradient(ellipse_at_20%_0%,_rgba(255,247,104,0.18),_transparent_50%),radial-gradient(ellipse_at_90%_20%,_rgba(22,133,248,0.16),_transparent_45%),linear-gradient(180deg,_#050505_0%,_#0a101c_55%,_#050505_100%)]"
      />

      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 pt-5 safe-pt sm:px-8">
        <Link
          href="/"
          className="font-heading text-xl font-extrabold tracking-tight text-volt-500"
        >
          Pact
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="#how"
            className="hidden text-sm text-white/55 transition-colors hover:text-white/85 sm:inline"
          >
            How it works
          </Link>
          <Button
            asChild
            variant="ghost"
            className="h-10 rounded-full px-3 text-white/60 hover:bg-white/5 hover:text-white"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            className="h-10 rounded-full bg-volt-500 px-4 font-semibold text-ink-950 hover:bg-volt-500/90"
          >
            <Link href="#waitlist">Join beta</Link>
          </Button>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="relative mx-auto grid w-full max-w-6xl items-start gap-10 px-5 pb-16 pt-10 sm:px-8 lg:min-h-[calc(100dvh-4.5rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pb-20 lg:pt-6">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 1, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="font-heading text-[clamp(3rem,10vw,5.75rem)] leading-[0.86] font-extrabold tracking-[-0.05em] text-volt-500"
            >
              Pact
            </motion.p>
            <LandingDynamicHeadline />
            <motion.p
              initial={{ opacity: 1, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-3 max-w-md text-base leading-relaxed text-white/60 sm:text-lg"
            >
              Make commitments with people you trust, show progress, and recover
              together when plans change.
            </motion.p>

            <motion.div
              initial={{ opacity: 1, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Button
                asChild
                className="h-12 rounded-full bg-volt-500 px-6 text-base font-semibold text-ink-950 hover:bg-volt-500/90"
              >
                <Link href="#waitlist">Join the private beta</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="h-12 rounded-full px-5 text-base text-white/55 hover:bg-white/5 hover:text-white"
              >
                <Link href="#how">
                  See how it works
                  <ArrowDown className="size-4" />
                </Link>
              </Button>
            </motion.div>
          </div>

          <LandingHeroDevice />
        </section>

        <section className="relative border-t border-white/8 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-bold tracking-tight">
              A task list cannot hold you accountable.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg">
              You can organise every task perfectly and still postpone the work.
              Pact adds the missing layer: a clear commitment, a trusted person,
              and a plan for what happens when progress stops.
            </p>
          </div>
        </section>

        <section
          id="how"
          className="relative scroll-mt-20 border-t border-white/8 px-5 py-20 sm:px-8 sm:py-28"
        >
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold tracking-[0.14em] text-volt-500/80 uppercase">
              How it works
            </p>
            <h2 className="font-heading mt-3 max-w-xl text-[clamp(1.75rem,4vw,2.6rem)] leading-[1.1] font-bold tracking-tight">
              Structure the accountability you already want.
            </h2>

            <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {steps.map((step, index) => (
                <li key={step.title} className="min-w-0">
                  <p className="font-heading text-4xl font-extrabold tracking-tight text-white/15">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-heading mt-3 text-xl font-bold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/50 sm:text-[0.95rem]">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative border-t border-white/8 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-heading text-[clamp(1.6rem,3.5vw,2.25rem)] font-bold tracking-tight">
              Built for follow-through
            </h2>
            <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {differentiators.map((item) => (
                <li
                  key={item}
                  className="border-b border-white/8 py-3 text-base text-white/70"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="waitlist"
          className="relative scroll-mt-20 border-t border-white/8 px-5 py-24 sm:px-8 sm:py-32"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-bold tracking-tight">
              Join the private beta waitlist
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/55 sm:text-lg">
              Leave your email and we&apos;ll invite you when a slot opens for
              you and someone you trust.
            </p>
            <div className="mt-8">
              <LandingBetaForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/8 px-5 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-heading text-lg font-extrabold tracking-tight text-volt-500">
            Pact
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/40">
            <Link href="/privacy" className="hover:text-white/70">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white/70">
              Terms
            </Link>
            <Link href="/sign-in" className="hover:text-white/70">
              Sign in
            </Link>
            <span>© {new Date().getFullYear()} joinpact.tech</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
