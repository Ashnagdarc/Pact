import type { TargetAndTransition, Transition } from "motion/react";

export type OnboardingTransition =
  | "fadeUp"
  | "slideLeft"
  | "slideRight"
  | "zoom"
  | "flip"
  | "blur";

type StepVariant = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
};

export const stepTransitions: Record<
  number,
  { enter: OnboardingTransition; exit: OnboardingTransition }
> = {
  0: { enter: "zoom", exit: "blur" },
  1: { enter: "blur", exit: "slideLeft" },
  2: { enter: "blur", exit: "fadeUp" },
  3: { enter: "flip", exit: "zoom" },
  4: { enter: "slideRight", exit: "slideLeft" },
  5: { enter: "fadeUp", exit: "slideRight" },
  6: { enter: "slideLeft", exit: "blur" },
  7: { enter: "slideRight", exit: "fadeUp" },
  8: { enter: "zoom", exit: "blur" },
  9: { enter: "fadeUp", exit: "zoom" },
};

const variants: Record<OnboardingTransition, StepVariant> = {
  fadeUp: {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  },
  slideRight: {
    initial: { opacity: 0, x: -40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 40 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.04 },
  },
  flip: {
    initial: { opacity: 0, rotateX: 18, y: 16 },
    animate: { opacity: 1, rotateX: 0, y: 0 },
    exit: { opacity: 0, rotateX: -12, y: -12 },
  },
  blur: {
    initial: { opacity: 0, filter: "blur(12px)", y: 12 },
    animate: { opacity: 1, filter: "blur(0px)", y: 0 },
    exit: { opacity: 0, filter: "blur(8px)", y: -8 },
  },
};

export function getStepMotion(step: number, phase: "enter" | "exit"): StepVariant & {
  transition: Transition;
} {
  const config = stepTransitions[step] ?? stepTransitions[0]!;
  const key = phase === "enter" ? config.enter : config.exit;
  const variant = variants[key];
  return {
    initial: variant.initial,
    animate: variant.animate,
    exit: variant.exit,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  };
}
