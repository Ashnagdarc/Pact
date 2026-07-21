import { z } from "zod";

export const createPactSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Name your Pact")
    .max(60, "Keep it under 60 characters"),
  description: z.string().trim().max(280).optional().or(z.literal("")),
  goalType: z.enum([
    "career",
    "study",
    "fitness",
    "creative",
    "habits",
    "other",
  ]),
  accountabilityStyle: z.enum([
    "gentle",
    "supportive",
    "firm",
    "competitive",
  ]),
  checkInFrequency: z.enum(["daily", "weekdays", "weekly"]),
  tone: z.enum(["signal", "volt", "cream", "mint", "paper", "coral"]),
});

export type CreatePactValues = z.infer<typeof createPactSchema>;

export const goalTypeLabel: Record<CreatePactValues["goalType"], string> = {
  career: "Career",
  study: "Study",
  fitness: "Fitness",
  creative: "Creative",
  habits: "Habits",
  other: "Other",
};

export const styleLabel: Record<
  CreatePactValues["accountabilityStyle"],
  string
> = {
  gentle: "Gentle",
  supportive: "Supportive",
  firm: "Firm",
  competitive: "Competitive",
};

export const frequencyLabel: Record<
  CreatePactValues["checkInFrequency"],
  string
> = {
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
};
