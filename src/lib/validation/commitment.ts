import { z } from "zod";

export const createCommitmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Give it a short title")
    .max(80, "Keep it under 80 characters"),
  description: z
    .string()
    .trim()
    .max(280, "Keep notes under 280 characters")
    .optional()
    .or(z.literal("")),
  pactId: z.string().optional().or(z.literal("")),
  duePreset: z.enum(["today", "tomorrow", "week", "none"]),
  tone: z.enum(["coral", "volt", "cream", "mint", "paper", "signal"]),
});

export type CreateCommitmentValues = z.infer<typeof createCommitmentSchema>;

export function dueAtFromPreset(
  preset: CreateCommitmentValues["duePreset"]
): number | undefined {
  const now = new Date();

  switch (preset) {
    case "today": {
      now.setHours(18, 0, 0, 0);
      return now.getTime();
    }
    case "tomorrow": {
      now.setDate(now.getDate() + 1);
      now.setHours(18, 0, 0, 0);
      return now.getTime();
    }
    case "week": {
      now.setDate(now.getDate() + 7);
      now.setHours(18, 0, 0, 0);
      return now.getTime();
    }
    case "none":
      return undefined;
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}
