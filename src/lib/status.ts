import type { LucideIcon } from "lucide-react";
import {
  Check,
  CirclePause,
  HandHelping,
  OctagonAlert,
  Radio,
  TriangleAlert,
} from "lucide-react";

export const commitmentStatuses = [
  "done",
  "on_track",
  "slipping",
  "blocked",
  "need_help",
  "paused",
] as const;

export type CommitmentStatus = (typeof commitmentStatuses)[number];

export const statusLabel: Record<CommitmentStatus, string> = {
  done: "Done",
  on_track: "On track",
  slipping: "Slipping",
  blocked: "Blocked",
  need_help: "Need help",
  paused: "Paused",
};

export const statusTone: Record<
  CommitmentStatus,
  "mint" | "signal" | "volt" | "coral" | "muted"
> = {
  done: "mint",
  on_track: "signal",
  slipping: "volt",
  blocked: "coral",
  need_help: "coral",
  paused: "muted",
};

export const statusIcon: Record<CommitmentStatus, LucideIcon> = {
  done: Check,
  on_track: Radio,
  slipping: TriangleAlert,
  blocked: OctagonAlert,
  need_help: HandHelping,
  paused: CirclePause,
};
