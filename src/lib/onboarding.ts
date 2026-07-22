import type { CreatePactValues } from "@/lib/validation/pact";

export const ONBOARDING_STEP_COUNT = 10;
export const ONBOARDING_DRAFT_KEY = "pact_onboarding_draft";
export const ONBOARDING_PENDING_KEY = "pact_onboarding_pending";

export type OnboardingDraft = {
  displayName: string;
  goalFocus: CreatePactValues["goalType"];
  accountabilityStyle: CreatePactValues["accountabilityStyle"];
  checkInFrequency: CreatePactValues["checkInFrequency"];
  notificationsEnabled: boolean;
  step: number;
};

export const defaultOnboardingDraft: OnboardingDraft = {
  displayName: "",
  goalFocus: "habits",
  accountabilityStyle: "supportive",
  checkInFrequency: "daily",
  notificationsEnabled: true,
  step: 0,
};

export function readOnboardingDraft(): OnboardingDraft {
  if (typeof window === "undefined") return defaultOnboardingDraft;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return defaultOnboardingDraft;
    return { ...defaultOnboardingDraft, ...JSON.parse(raw) };
  } catch {
    return defaultOnboardingDraft;
  }
}

export function writeOnboardingDraft(draft: Partial<OnboardingDraft>) {
  if (typeof window === "undefined") return;
  const next = { ...readOnboardingDraft(), ...draft };
  sessionStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(next));
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ONBOARDING_DRAFT_KEY);
}

export type OnboardingPending = Omit<OnboardingDraft, "step">;

export function saveOnboardingPending(draft: OnboardingPending) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_PENDING_KEY, JSON.stringify(draft));
}

export function readOnboardingPending(): OnboardingPending | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingPending;
  } catch {
    return null;
  }
}

export function clearOnboardingPending() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_PENDING_KEY);
}
