import type { CreatePactValues } from "@/lib/validation/pact";

export type PactTemplate = {
  id: string;
  label: string;
  blurb: string;
  values: Partial<CreatePactValues> &
    Pick<CreatePactValues, "title" | "goalType" | "accountabilityStyle">;
};

/** Preset Pact setups — fills the create form (no DB required). */
export const PACT_TEMPLATES: PactTemplate[] = [
  {
    id: "career-sprint",
    label: "Career sprint",
    blurb: "Weekly check-ins on a job or skill goal.",
    values: {
      title: "Career sprint",
      description: "Ship one career milestone with a partner watching.",
      goalType: "career",
      accountabilityStyle: "supportive",
      checkInFrequency: "weekly",
      privacyLevel: "invite_only",
      tone: "signal",
    },
  },
  {
    id: "study-duo",
    label: "Study duo",
    blurb: "Daily focus for exams or coursework.",
    values: {
      title: "Study duo",
      description: "Daily study blocks. Rescue when we slip.",
      goalType: "study",
      accountabilityStyle: "firm",
      checkInFrequency: "daily",
      privacyLevel: "invite_only",
      tone: "volt",
    },
  },
  {
    id: "creator-ship",
    label: "Creator ship",
    blurb: "Publish consistently with gentle pressure.",
    values: {
      title: "Creator ship week",
      description: "Ship creative work on a steady cadence.",
      goalType: "creative",
      accountabilityStyle: "gentle",
      checkInFrequency: "weekly",
      privacyLevel: "invite_only",
      tone: "mint",
    },
  },
  {
    id: "fitness-pair",
    label: "Fitness pair",
    blurb: "Move together without a public leaderboard.",
    values: {
      title: "Fitness pair",
      description: "Shared movement goals. Support over streaks.",
      goalType: "fitness",
      accountabilityStyle: "competitive",
      checkInFrequency: "daily",
      privacyLevel: "partners",
      tone: "coral",
    },
  },
  {
    id: "circle",
    label: "Accountability circle",
    blurb: "3+ people holding a shared outcome.",
    values: {
      title: "Our circle",
      description: "A small circle for one shared outcome.",
      goalType: "other",
      accountabilityStyle: "supportive",
      checkInFrequency: "weekly",
      privacyLevel: "invite_only",
      tone: "cream",
    },
  },
];
