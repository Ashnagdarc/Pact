"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { api } from "@convex/_generated/api";
import { SceneBackdrop } from "@/components/media/scene-backdrop";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { renderStoryStep } from "@/components/onboarding/onboarding-story-steps";
import { getStepMotion } from "@/components/onboarding/onboarding-transitions";
import { AppShell } from "@/components/navigation/app-shell";
import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/ui/confetti-burst";
import { useCurrentUser } from "@/hooks/use-demo-user";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import { getOnboardingStepMeta } from "@/lib/onboarding-story";
import {
  clearOnboardingDraft,
  defaultOnboardingDraft,
  ONBOARDING_FIRST_STEP,
  ONBOARDING_STEP_COUNT,
  readOnboardingDraft,
  readOnboardingPending,
  saveOnboardingPending,
  writeOnboardingDraft,
  type OnboardingDraft,
} from "@/lib/onboarding";
import { playFeedback } from "@/lib/feedback";
import { onboardingSceneForStep } from "@/lib/scene-images";
import type { CreatePactValues } from "@/lib/validation/pact";

export function OnboardingScreen() {
  const router = useRouter();
  const { user, userId, isAuthenticated, loading } = useCurrentUser();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const { enablePush } = usePushSubscription();

  const [step, setStep] = useState(ONBOARDING_FIRST_STEP);
  const [draft, setDraft] = useState<OnboardingDraft>(defaultOnboardingDraft);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soundReady, setSoundReady] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const pendingApplyStarted = useRef(false);

  const stepMeta = getOnboardingStepMeta(step);

  useEffect(() => {
    const stored = readOnboardingDraft();
    setDraft(stored);
    setStep(stored.step);
  }, []);

  useEffect(() => {
    writeOnboardingDraft({ step });
  }, [step]);

  useEffect(() => {
    const enableSound = () => setSoundReady(true);
    window.addEventListener("pointerdown", enableSound, { once: true });
    return () => window.removeEventListener("pointerdown", enableSound);
  }, []);

  useEffect(() => {
    if (step === 9) {
      setConfettiKey((key) => key + 1);
      playFeedback({
        sound: soundReady ? "success" : undefined,
        haptic: "success",
      });
      return;
    }
    if (!soundReady) return;
    playFeedback({
      sound: "whoosh",
      haptic: "step",
    });
  }, [step, soundReady]);

  useEffect(() => {
    if (user?.displayName && !draft.displayName) {
      setDraft((prev) => ({ ...prev, displayName: user.displayName }));
    }
  }, [user?.displayName, draft.displayName]);

  useEffect(() => {
    if (loading || !user?.onboardingCompleted) return;
    router.replace("/app");
  }, [loading, user?.onboardingCompleted, router]);

  // If sign-in landed us back here with pending local answers, finish once.
  useEffect(() => {
    if (loading || !isAuthenticated || !userId) return;
    if (user?.onboardingCompleted) return;
    if (pendingApplyStarted.current) return;
    const pending = readOnboardingPending();
    if (!pending) return;

    pendingApplyStarted.current = true;
    setFinishing(true);

    // Keep pending in localStorage until Convex shows onboardingCompleted
    // (cleared by useCurrentUser). Clearing here caused Today→onboarding bounce.
    void (async () => {
      try {
        await completeOnboarding({
          displayName: pending.displayName.trim() || undefined,
          goalFocus: pending.goalFocus,
          defaultAccountabilityStyle: pending.accountabilityStyle,
          defaultCheckInFrequency: pending.checkInFrequency,
          emailNotifications: pending.notificationsEnabled,
          pushNotifications: pending.notificationsEnabled,
        });
        if (pending.notificationsEnabled) {
          try {
            await enablePush();
          } catch {
            // Permission / VAPID may fail; prefs still persist as opted-in.
          }
        }
        clearOnboardingDraft();
        router.replace("/app/pacts/new");
      } catch (err) {
        pendingApplyStarted.current = false;
        setFinishing(false);
        setError(
          err instanceof Error ? err.message : "Could not finish onboarding"
        );
      }
    })();
  }, [
    completeOnboarding,
    enablePush,
    isAuthenticated,
    loading,
    router,
    user?.onboardingCompleted,
    userId,
  ]);

  function updateDraft(patch: Partial<OnboardingDraft>) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      writeOnboardingDraft(next);
      return next;
    });
  }

  function goNext() {
    playFeedback({ sound: soundReady ? "slide" : undefined, haptic: "medium" });
    setStep((prev) => Math.min(prev + 1, ONBOARDING_STEP_COUNT - 1));
  }

  function goBack() {
    playFeedback({ sound: soundReady ? "tick" : undefined, haptic: "light" });
    setStep((prev) => Math.max(prev - 1, ONBOARDING_FIRST_STEP));
  }

  async function finish() {
    setError(null);
    setFinishing(true);
    setConfettiKey((key) => key + 1);
    playFeedback({
      sound: soundReady ? "success" : undefined,
      haptic: "success",
    });

    try {
      let pushGranted = false;
      if (draft.notificationsEnabled && typeof Notification !== "undefined") {
        const permission = await Notification.requestPermission();
        pushGranted = permission === "granted";
      }

      if (isAuthenticated && userId) {
        saveOnboardingPending({
          displayName: draft.displayName,
          goalFocus: draft.goalFocus,
          accountabilityStyle: draft.accountabilityStyle,
          checkInFrequency: draft.checkInFrequency,
          notificationsEnabled: draft.notificationsEnabled,
        });
        await completeOnboarding({
          displayName: draft.displayName.trim() || undefined,
          goalFocus: draft.goalFocus,
          defaultAccountabilityStyle: draft.accountabilityStyle,
          defaultCheckInFrequency: draft.checkInFrequency,
          emailNotifications: draft.notificationsEnabled,
          pushNotifications: draft.notificationsEnabled && pushGranted,
        });
        if (draft.notificationsEnabled && pushGranted) {
          try {
            await enablePush();
          } catch {
            // Prefs already saved; user can enable push later in settings.
          }
        }
        clearOnboardingDraft();
        // Pending stays until useCurrentUser sees onboardingCompleted.
        router.push("/app/pacts/new");
        router.refresh();
        return;
      }

      saveOnboardingPending({
        displayName: draft.displayName,
        goalFocus: draft.goalFocus,
        accountabilityStyle: draft.accountabilityStyle,
        checkInFrequency: draft.checkInFrequency,
        notificationsEnabled: draft.notificationsEnabled,
      });
      clearOnboardingDraft();
      router.push(
        `/sign-in?mode=sign-up&next=${encodeURIComponent("/app/pacts/new")}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish onboarding");
    } finally {
      setFinishing(false);
    }
  }

  const isLastStep = step === ONBOARDING_STEP_COUNT - 1;
  const canContinue = step !== 9 || draft.displayName.trim().length >= 2;
  const stepMotion = getStepMotion(step, "enter");
  const stepExit = getStepMotion(step, "exit");

  return (
    <AppShell showTabs={false} variant="hero">
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={onboardingSceneForStep(step)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-0 z-0"
        >
          <SceneBackdrop src={onboardingSceneForStep(step)} tone="story" />
        </motion.div>
      </AnimatePresence>
      <ConfettiBurst burstKey={confettiKey} />
      <div className="relative z-10 flex min-h-[calc(100dvh-2rem)] flex-col">
        <header className="mb-6 flex items-center gap-3 pt-1">
          {step > ONBOARDING_FIRST_STEP ? (
            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              className="-ml-1 shrink-0 rounded-full p-1 text-white/50 transition-colors hover:text-white/80"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : null}
          <OnboardingProgress step={step} className="min-w-0 flex-1" />
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={stepMotion.initial}
              animate={stepMotion.animate}
              exit={stepExit.exit}
              transition={stepMotion.transition}
              className="flex min-h-0 flex-1 flex-col"
            >
              {renderStoryStep(step, {
                draft,
                onGoalChange: (goalFocus: CreatePactValues["goalType"]) =>
                  updateDraft({ goalFocus }),
                onStyleChange: (
                  accountabilityStyle: CreatePactValues["accountabilityStyle"],
                ) => updateDraft({ accountabilityStyle }),
                onFrequencyChange: (
                  checkInFrequency: CreatePactValues["checkInFrequency"],
                ) => updateDraft({ checkInFrequency }),
                onNameChange: (displayName: string) =>
                  updateDraft({ displayName }),
                onToggleNotifications: (notificationsEnabled: boolean) =>
                  updateDraft({ notificationsEnabled }),
              })}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="relative z-10 mt-auto grid gap-2 pt-8 pb-1">
          {error ? (
            <p className="text-center text-sm text-coral-400" role="alert">
              {error}
            </p>
          ) : null}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              disabled={!canContinue || finishing || (isLastStep && loading)}
              onClick={isLastStep ? finish : goNext}
              className="h-12 w-full rounded-full bg-volt-500 text-base font-semibold text-white hover:bg-volt-500/90"
            >
              {finishing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isLastStep ? (
                isAuthenticated ? (
                  "Start my first pact"
                ) : (
                  "Create account"
                )
              ) : (
                <>
                  {stepMeta.continueLabel}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </motion.div>
        </footer>
      </div>
    </AppShell>
  );
}
