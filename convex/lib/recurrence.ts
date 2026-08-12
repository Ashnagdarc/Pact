import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";

export type RecurrenceRule = "daily" | "weekdays" | "weekly";

function zonedParts(timeZone: string, ms: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"),
  };
}

function zonedWallTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number
): number {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second, 0);
  for (let i = 0; i < 3; i++) {
    const wall = zonedParts(timeZone, utc);
    const asUtc = Date.UTC(
      wall.year,
      wall.month - 1,
      wall.day,
      wall.hour,
      wall.minute,
      wall.second,
      0
    );
    const target = Date.UTC(year, month - 1, day, hour, minute, second, 0);
    const delta = target - asUtc;
    if (delta === 0) break;
    utc += delta;
  }
  return utc;
}

function addCalendarDays(
  dueAt: number,
  days: number,
  timeZone: string
): number {
  const wall = zonedParts(timeZone, dueAt);
  return zonedWallTimeToUtc(
    timeZone,
    wall.year,
    wall.month,
    wall.day + days,
    wall.hour,
    wall.minute,
    wall.second
  );
}

function isWeekday(timeZone: string, ms: number) {
  const wd = zonedParts(timeZone, ms).weekday;
  return wd !== "Sat" && wd !== "Sun";
}

/** Next due instant for a recurrence rule, preserving local wall time. */
export function nextDueAt(
  fromDueAt: number,
  rule: RecurrenceRule,
  timeZone: string
): number {
  const tz = timeZone.trim() || "UTC";
  if (rule === "weekly") {
    return addCalendarDays(fromDueAt, 7, tz);
  }
  if (rule === "daily") {
    return addCalendarDays(fromDueAt, 1, tz);
  }
  // weekdays — next Mon–Fri
  let candidate = fromDueAt;
  for (let i = 0; i < 8; i++) {
    candidate = addCalendarDays(candidate, 1, tz);
    if (isWeekday(tz, candidate)) return candidate;
  }
  return candidate;
}

function defaultReminderAt(dueAt?: number) {
  if (!dueAt) return undefined;
  return Math.max(Date.now() + 60_000, dueAt - 60 * 60 * 1000);
}

/**
 * When a recurring commitment is completed, spawn the next open instance.
 * Returns the new id or null if not applicable.
 */
export async function spawnNextRecurrence(
  ctx: MutationCtx,
  commitment: Doc<"commitments">,
  timeZone: string
): Promise<Id<"commitments"> | null> {
  if (!commitment.isRecurring || !commitment.recurrenceRule) return null;
  if (!commitment.dueAt) return null;

  const nextDue = nextDueAt(
    commitment.dueAt,
    commitment.recurrenceRule,
    timeZone
  );
  const reminderAt = defaultReminderAt(nextDue);
  const seriesId = commitment.seriesId ?? commitment._id;

  // Reset checklist items for the next cycle.
  const checklist = commitment.checklist?.map((item) => ({
    label: item.label,
    done: false,
  }));

  const nextId = await ctx.db.insert("commitments", {
    pactId: commitment.pactId,
    creatorId: commitment.creatorId,
    assigneeId: commitment.assigneeId,
    title: commitment.title,
    description: commitment.description,
    completionCriteria: commitment.completionCriteria,
    status: "open",
    dueAt: nextDue,
    reminderAt,
    evidenceRequired: commitment.evidenceRequired,
    favorited: commitment.favorited,
    checklist,
    tone: commitment.tone,
    isRecurring: true,
    recurrenceRule: commitment.recurrenceRule,
    seriesId,
  });

  await ctx.db.insert("activityEvents", {
    userId: commitment.assigneeId,
    pactId: commitment.pactId,
    eventName: "commitment_created",
    metadata: {
      commitmentId: nextId,
      title: commitment.title,
      recurringFrom: commitment._id,
      seriesId,
    },
  });

  if (reminderAt) {
    await ctx.scheduler.runAfter(
      0,
      internal.reminders.scheduleCommitmentReminder,
      { commitmentId: nextId, reminderAt }
    );
  }

  return nextId;
}
