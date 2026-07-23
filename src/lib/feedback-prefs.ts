const MUTE_KEY = "pact.feedbackMuted";

export function readFeedbackMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeFeedbackMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (muted) {
      window.localStorage.setItem(MUTE_KEY, "1");
    } else {
      window.localStorage.removeItem(MUTE_KEY);
    }
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

/** True when sound/haptics should not play (user mute or reduced motion). */
export function shouldMuteFeedback(): boolean {
  if (typeof window === "undefined") return true;
  if (readFeedbackMuted()) return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
