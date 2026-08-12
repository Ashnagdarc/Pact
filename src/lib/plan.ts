export type PlanId = "free" | "premium";

export const PLAN_LABEL: Record<PlanId, string> = {
  free: "Free",
  premium: "Premium",
};

/** Soft limits — Premium lifts caps without blocking core accountability. */
export const PLAN_LIMITS = {
  free: {
    maxCircleMembers: 3, // owner + 2 partners
    focusMinutesMax: 25,
    calendarExport: false,
    templates: true,
  },
  premium: {
    maxCircleMembers: 12,
    focusMinutesMax: 90,
    calendarExport: true,
    templates: true,
  },
} as const;

export function resolvePlan(plan?: string | null): PlanId {
  return plan === "premium" ? "premium" : "free";
}

export function planLimits(plan?: string | null) {
  return PLAN_LIMITS[resolvePlan(plan)];
}

export function canAddCircleMember(
  plan: string | null | undefined,
  acceptedMemberCount: number
): boolean {
  return acceptedMemberCount < planLimits(plan).maxCircleMembers;
}
