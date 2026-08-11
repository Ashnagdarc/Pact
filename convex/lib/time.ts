/**
 * Calendar day bounds for `now` in an IANA timezone (e.g. Africa/Lagos).
 * Uses Intl only - no extra date libs in Convex.
 */
export function dayBoundsInTimeZone(
  timeZone: string,
  now = Date.now()
): { start: number; end: number } {
  const tz = timeZone.trim() || "UTC";
  try {
    const { year, month, day } = zonedYmd(tz, now);
    const start = zonedWallTimeToUtc(tz, year, month, day, 0, 0, 0, 0);
    const next = zonedWallTimeToUtc(tz, year, month, day + 1, 0, 0, 0, 0);
    return { start, end: next - 1 };
  } catch {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    const start = d.getTime();
    return { start, end: start + 24 * 60 * 60 * 1000 - 1 };
  }
}

function zonedYmd(timeZone: string, ms: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

/** Convert a wall-clock datetime in `timeZone` to a UTC epoch ms. */
function zonedWallTimeToUtc(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number
): number {
  // Iteratively correct UTC guess using the zone's wall time (handles DST).
  let utc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  for (let i = 0; i < 3; i++) {
    const wall = zonedParts(timeZone, utc);
    const asUtc = Date.UTC(
      wall.year,
      wall.month - 1,
      wall.day,
      wall.hour,
      wall.minute,
      wall.second,
      wall.ms
    );
    const target = Date.UTC(year, month - 1, day, hour, minute, second, ms);
    const delta = target - asUtc;
    if (delta === 0) break;
    utc += delta;
  }
  return utc;
}

function zonedParts(timeZone: string, ms: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(ms));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
    ms: 0,
  };
}
