"use client";

import Link from "next/link";
import { ArrowRight, HandHeart, Handshake, Target } from "lucide-react";
import { motion } from "motion/react";

import { AppShell } from "@/components/navigation/app-shell";
import { WelcomePreviewStack } from "@/components/screens/welcome-preview-stack";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Target,
    title: "Set commitments",
    description: "Name what you'll do today — clearly and kindly.",
  },
  {
    icon: Handshake,
    title: "Partner up",
    description: "Share pacts with people who keep you honest.",
  },
  {
    icon: HandHeart,
    title: "Recover together",
    description: "Slip-ups happen. Rescue plans get you back on track.",
  },
] as const;

export function WelcomeScreen() {
  return (
    <AppShell showTabs={false} variant="hero">
      <div className="relative flex min-h-[calc(100dvh-2rem)] flex-col pb-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="pt-4"
        >
          <p className="text-sm font-medium text-white/45">
            For people who show up
          </p>
          <h1 className="font-heading mt-3 text-[3.4rem] leading-[0.92] font-extrabold tracking-tight">
            <span className="text-volt-500">Pact</span>
          </h1>
          <p className="mt-4 max-w-[18rem] text-lg leading-snug font-medium text-white/75">
            Make commitments. Show your progress. Recover together.
          </p>
        </motion.div>

        <div className="flex min-h-[7.5rem] flex-1 items-center justify-center py-8">
          <WelcomePreviewStack />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-2.5"
        >
          <div className="mb-1 grid gap-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.24 + index * 0.06, duration: 0.4 }}
                className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-3 backdrop-blur-sm"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-volt-500/15 text-volt-500">
                  <feature.icon className="size-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <Button
            asChild
            className="h-12 rounded-full bg-volt-500 text-base font-semibold text-ink-950 hover:bg-volt-500/90"
          >
            <Link href="/sign-in?mode=sign-up">
              Start with a partner
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-11 rounded-full text-white/45 hover:text-white/75"
          >
            <Link href="/sign-in">Already have an account? Sign in</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-10 rounded-full text-white/35 hover:text-white/60"
          >
            <Link href="/waitlist">Prefer the waitlist?</Link>
          </Button>
        </motion.div>
      </div>
    </AppShell>
  );
}
