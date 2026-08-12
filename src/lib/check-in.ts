export const checkInSignals = [
  "done",
  "on_track",
  "slipping",
  "blocked",
  "need_help",
] as const;

export type CheckInSignal = (typeof checkInSignals)[number];

export const checkInSignalLabel: Record<CheckInSignal, string> = {
  done: "Done",
  on_track: "On track",
  slipping: "Slipping",
  blocked: "Blocked",
  need_help: "Need help",
};

export const partnerResponseTypes = [
  "well_done",
  "proof_accepted",
  "what_is_blocking",
  "how_can_i_help",
  "adjust_plan",
  "available_to_work",
  "send_update",
] as const;

export type PartnerResponseType = (typeof partnerResponseTypes)[number];

export const partnerResponseLabel: Record<PartnerResponseType, string> = {
  well_done: "Well done",
  proof_accepted: "Proof accepted",
  what_is_blocking: "What is blocking you?",
  how_can_i_help: "How can I help?",
  adjust_plan: "Let's adjust the plan",
  available_to_work: "I can work with you",
  send_update: "Please send an update",
};

/** Signal-aware chips for a 5-second partner reply (PRD structured responses). */
export function suggestedPartnerResponses(
  signal: CheckInSignal
): PartnerResponseType[] {
  switch (signal) {
    case "done":
      return ["well_done", "proof_accepted", "send_update"];
    case "on_track":
      return ["well_done", "send_update", "available_to_work"];
    case "slipping":
      return ["what_is_blocking", "how_can_i_help", "adjust_plan", "send_update"];
    case "blocked":
      return [
        "how_can_i_help",
        "what_is_blocking",
        "available_to_work",
        "adjust_plan",
      ];
    case "need_help":
      return [
        "how_can_i_help",
        "available_to_work",
        "what_is_blocking",
        "adjust_plan",
      ];
    default: {
      const _exhaustive: never = signal;
      return _exhaustive;
    }
  }
}
