import { v } from "convex/values";

export const commitmentStatus = v.union(
  v.literal("open"),
  v.literal("done"),
  v.literal("on_track"),
  v.literal("slipping"),
  v.literal("blocked"),
  v.literal("need_help"),
  v.literal("paused"),
  v.literal("missed")
);

export const pactHealthStatus = v.union(
  v.literal("healthy"),
  v.literal("needs_attention"),
  v.literal("at_risk"),
  v.literal("paused"),
  v.literal("completed")
);

export const checkInSignal = v.union(
  v.literal("done"),
  v.literal("on_track"),
  v.literal("slipping"),
  v.literal("blocked"),
  v.literal("need_help")
);

export const partnerResponseType = v.union(
  v.literal("well_done"),
  v.literal("proof_accepted"),
  v.literal("what_is_blocking"),
  v.literal("how_can_i_help"),
  v.literal("adjust_plan"),
  v.literal("available_to_work"),
  v.literal("send_update")
);

export const cardTone = v.union(
  v.literal("coral"),
  v.literal("volt"),
  v.literal("cream"),
  v.literal("mint"),
  v.literal("paper"),
  v.literal("signal")
);

export const accountabilityStyle = v.union(
  v.literal("gentle"),
  v.literal("supportive"),
  v.literal("firm"),
  v.literal("competitive")
);

export const checkInFrequency = v.union(
  v.literal("daily"),
  v.literal("weekdays"),
  v.literal("weekly"),
  v.literal("custom")
);

export const memberRole = v.union(
  v.literal("owner"),
  v.literal("partner"),
  v.literal("observer")
);

export const invitationStatus = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("declined"),
  v.literal("revoked"),
  v.literal("expired")
);

export const blockerType = v.union(
  v.literal("ran_out_of_time"),
  v.literal("too_large"),
  v.literal("waiting_for_someone"),
  v.literal("priority_changed"),
  v.literal("lost_motivation"),
  v.literal("technical_problem"),
  v.literal("personal_emergency"),
  v.literal("other")
);

export const recoveryAction = v.union(
  v.literal("reduce_scope"),
  v.literal("split"),
  v.literal("reschedule"),
  v.literal("ask_help"),
  v.literal("pause"),
  v.literal("remove")
);

export const recoveryApprovalStatus = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("acknowledged"),
  v.literal("rejected")
);
