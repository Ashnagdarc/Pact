export type HapticPattern = "light" | "medium" | "select" | "step" | "success";

const patterns: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: [12, 40, 12],
  select: [10, 35, 14],
  step: [14, 30, 10],
  success: [18, 45, 22, 40, 28, 35, 16],
};

export function playHaptic(pattern: HapticPattern = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    // Vibration blocked or unsupported.
  }
}
