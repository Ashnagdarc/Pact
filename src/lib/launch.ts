/** Public launch target for waitlist / coming-soon UI (~3 months out). */
export const LAUNCH_AT = new Date("2026-10-22T12:00:00.000Z");

export const WAITLIST_EMAIL_KEY = "pact.waitlistEmail";

export type LaunchTimelineItem = {
  id: string;
  title: string;
  description: string;
  at: Date;
  status: "done" | "current" | "upcoming";
};

export function getLaunchTimeline(now = new Date()): LaunchTimelineItem[] {
  const items: Omit<LaunchTimelineItem, "status">[] = [
    {
      id: "waitlist",
      title: "Private waitlist",
      description: "You're on the list. We're inviting pairs in waves.",
      at: new Date("2026-07-22T12:00:00.000Z"),
    },
    {
      id: "closed-beta",
      title: "Closed beta",
      description: "First accountability pairs start testing live pacts.",
      at: new Date("2026-07-22T12:00:00.000Z"),
    },
    {
      id: "polish",
      title: "Polish & invites",
      description: "Rescue flows, notifications, and partner invites harden up.",
      at: new Date("2026-09-22T12:00:00.000Z"),
    },
    {
      id: "launch",
      title: "Public launch",
      description: "Pact opens for everyone who's been waiting.",
      at: LAUNCH_AT,
    },
  ];

  // Mark everything before the latest reached milestone as done; that
  // milestone as current; everything after as upcoming.
  let currentIndex = 0;
  for (let i = 0; i < items.length; i++) {
    if (now >= items[i]!.at) {
      currentIndex = i;
    }
  }
  if (now >= LAUNCH_AT) {
    currentIndex = items.length - 1;
  }

  return items.map((item, index) => {
    let status: LaunchTimelineItem["status"] = "upcoming";
    if (now >= LAUNCH_AT) {
      status = "done";
    } else if (index < currentIndex) {
      status = "done";
    } else if (index === currentIndex) {
      status = "current";
    }
    return { ...item, status };
  });
}

export type CountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  launched: boolean;
};

export function getCountdownParts(
  target: Date = LAUNCH_AT,
  now = new Date()
): CountdownParts {
  const totalMs = Math.max(0, target.getTime() - now.getTime());
  const launched = totalMs <= 0;
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);
  return { totalMs, days, hours, minutes, seconds, launched };
}

export function readWaitlistEmail() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(WAITLIST_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function writeWaitlistEmail(email: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WAITLIST_EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    // Ignore storage failures.
  }
}
