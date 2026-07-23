import { v } from "convex/values";

export const notificationType = v.union(
  v.literal("partner_update"),
  v.literal("help_request"),
  v.literal("partner_response"),
  v.literal("rescue_prompt"),
  v.literal("recovery_plan"),
  v.literal("invitation_accepted"),
  v.literal("pact_at_risk"),
  v.literal("weekly_review"),
  v.literal("commitment_due"),
  v.literal("evidence_uploaded")
);
