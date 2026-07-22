export type OnboardingAct = "give-up" | "pact" | "yours";

export type OnboardingStepMeta = {
  act: OnboardingAct;
  chapter: string;
  continueLabel: string;
};

export const onboardingActs: Record<
  OnboardingAct,
  { label: string; title: string }
> = {
  "give-up": { label: "Act I", title: "How we give up" },
  pact: { label: "Act II", title: "How a pact helps" },
  yours: { label: "Act III", title: "Make it yours" },
};

export const onboardingSteps: OnboardingStepMeta[] = [
  {
    act: "give-up",
    chapter: "Monday",
    continueLabel: "By Wednesday…",
  },
  {
    act: "give-up",
    chapter: "Wednesday",
    continueLabel: "Then Sunday hits",
  },
  {
    act: "give-up",
    chapter: "Sunday",
    continueLabel: "So what changes?",
  },
  {
    act: "give-up",
    chapter: "The turn",
    continueLabel: "Form a pact",
  },
  {
    act: "pact",
    chapter: "The pact",
    continueLabel: "Bring someone in",
  },
  {
    act: "pact",
    chapter: "Together",
    continueLabel: "When you slip",
  },
  {
    act: "pact",
    chapter: "Recover",
    continueLabel: "Make it yours",
  },
  {
    act: "yours",
    chapter: "Your focus",
    continueLabel: "Next",
  },
  {
    act: "yours",
    chapter: "Your rhythm",
    continueLabel: "Almost there",
  },
  {
    act: "yours",
    chapter: "Your pact",
    continueLabel: "Create account",
  },
];

export function getOnboardingStepMeta(step: number): OnboardingStepMeta {
  return onboardingSteps[step] ?? onboardingSteps[0]!;
}
