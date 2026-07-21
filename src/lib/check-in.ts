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
