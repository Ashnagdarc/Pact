/** Quiet-hours helpers — suppress external notify channels while in-app stays on. */

export type QuietHoursPrefs = {
  quietHoursEnabled?: boolean | null;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  quietHoursIncludeWeekends?: boolean | null;
  quietHoursAllowUrgent?: boolean | null;
  timezone?: string | null;
};

const URGENT_TYPES = new Set([
  "help_request",
  "rescue_prompt",
  "need_help",
]);

function parseHm(value: string | null | undefined): { h: number; m: number } | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

function minutesOfDay(h: number, m: number) {
  return h * 60 + m;
}

function zonedNowParts(timeZone: string, now: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const isWeekend = weekday === "Sat" || weekday === "Sun";
  return { isWeekend, minutes: minutesOfDay(hour, minute) };
}

/** True when local wall time is inside [start, end), supporting overnight windows. */
export function isInQuietHours(
  prefs: QuietHoursPrefs,
  now = Date.now()
): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const start = parseHm(prefs.quietHoursStart);
  const end = parseHm(prefs.quietHoursEnd);
  if (!start || !end) return false;

  const tz = (prefs.timezone || "UTC").trim() || "UTC";
  let wall: { isWeekend: boolean; minutes: number };
  try {
    wall = zonedNowParts(tz, now);
  } catch {
    const d = new Date(now);
    wall = {
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      minutes: minutesOfDay(d.getHours(), d.getMinutes()),
    };
  }

  if (prefs.quietHoursIncludeWeekends === false && wall.isWeekend) {
    return false;
  }

  const s = minutesOfDay(start.h, start.m);
  const e = minutesOfDay(end.h, end.m);
  if (s === e) return true; // full-day quiet
  if (s < e) return wall.minutes >= s && wall.minutes < e;
  // Overnight (e.g. 22:00 → 07:00)
  return wall.minutes >= s || wall.minutes < e;
}

export function shouldSuppressExternalNotify(
  prefs: QuietHoursPrefs,
  type: string,
  now = Date.now()
): boolean {
  if (!isInQuietHours(prefs, now)) return false;
  const allowUrgent = prefs.quietHoursAllowUrgent !== false;
  if (allowUrgent && URGENT_TYPES.has(type)) return false;
  return true;
}
