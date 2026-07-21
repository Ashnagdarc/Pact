export const blockerTypes = [
  "ran_out_of_time",
  "too_large",
  "waiting_for_someone",
  "priority_changed",
  "lost_motivation",
  "technical_problem",
  "personal_emergency",
  "other",
] as const;

export type BlockerType = (typeof blockerTypes)[number];

export const blockerLabel: Record<BlockerType, string> = {
  ran_out_of_time: "Ran out of time",
  too_large: "Task was too large",
  waiting_for_someone: "Waiting for someone",
  priority_changed: "Priority changed",
  lost_motivation: "Lost motivation",
  technical_problem: "Technical problem",
  personal_emergency: "Personal emergency",
  other: "Other",
};

export const recoveryActions = [
  "reduce_scope",
  "split",
  "reschedule",
  "ask_help",
  "pause",
  "remove",
] as const;

export type RecoveryAction = (typeof recoveryActions)[number];

export const recoveryActionLabel: Record<RecoveryAction, string> = {
  reduce_scope: "Reduce scope",
  split: "Split into smaller steps",
  reschedule: "Reschedule",
  ask_help: "Ask partner for help",
  pause: "Pause",
  remove: "Remove",
};

export const recoveryActionHint: Record<RecoveryAction, string> = {
  reduce_scope: "Keep the goal, shrink what “done” means.",
  split: "Break it into checklist steps you can finish.",
  reschedule: "Pick a kinder deadline and keep moving.",
  ask_help: "Signal your partner that you need support.",
  pause: "Park it without guilt. You can restart later.",
  remove: "Drop it from active commitments.",
};

/** Suggested actions ranked for a given blocker */
export function suggestedActionsFor(blocker: BlockerType): RecoveryAction[] {
  switch (blocker) {
    case "ran_out_of_time":
      return ["reschedule", "reduce_scope", "split", "ask_help"];
    case "too_large":
      return ["split", "reduce_scope", "reschedule", "ask_help"];
    case "waiting_for_someone":
      return ["ask_help", "reschedule", "pause", "reduce_scope"];
    case "priority_changed":
      return ["reschedule", "pause", "reduce_scope", "remove"];
    case "lost_motivation":
      return ["reduce_scope", "ask_help", "split", "pause"];
    case "technical_problem":
      return ["ask_help", "reschedule", "reduce_scope", "pause"];
    case "personal_emergency":
      return ["pause", "reschedule", "ask_help", "reduce_scope"];
    case "other":
      return ["reduce_scope", "reschedule", "split", "ask_help", "pause", "remove"];
    default: {
      const _exhaustive: never = blocker;
      return _exhaustive;
    }
  }
}

export function needsRescue(input: {
  status: string;
  dueAt?: number;
}): boolean {
  if (
    input.status === "missed" ||
    input.status === "blocked" ||
    input.status === "need_help" ||
    input.status === "slipping"
  ) {
    return true;
  }

  if (
    typeof input.dueAt === "number" &&
    input.dueAt < Date.now() &&
    input.status !== "done" &&
    input.status !== "paused"
  ) {
    return true;
  }

  return false;
}
