import { shouldMuteFeedback } from "@/lib/feedback-prefs";

export type UiSound =
  | "slide"
  | "tick"
  | "chime"
  | "pop"
  | "whoosh"
  | "reveal"
  | "select"
  | "success";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType,
  gain: number,
  attack = 0.01,
  startOffset = 0,
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const now = ctx.currentTime + startOffset;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(gain, now + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export function playUiSound(sound: UiSound) {
  if (shouldMuteFeedback()) return;
  switch (sound) {
    case "slide":
      playTone(220, 0.08, "sine", 0.04);
      playTone(330, 0.1, "sine", 0.025, 0.02);
      break;
    case "tick":
      playTone(520, 0.06, "triangle", 0.03);
      break;
    case "chime":
      playTone(392, 0.14, "sine", 0.035);
      playTone(523.25, 0.18, "sine", 0.028, 0.03);
      break;
    case "pop":
      playTone(180, 0.05, "sine", 0.05);
      playTone(420, 0.08, "triangle", 0.03, 0.01, 0.02);
      break;
    case "whoosh":
      playTone(140, 0.12, "sine", 0.025);
      playTone(90, 0.16, "sine", 0.02, 0.02, 0.04);
      break;
    case "reveal":
      playTone(260, 0.1, "sine", 0.03);
      playTone(440, 0.14, "sine", 0.028, 0.02, 0.05);
      break;
    case "select":
      playTone(360, 0.07, "triangle", 0.035);
      playTone(480, 0.09, "sine", 0.025, 0.01, 0.03);
      break;
    case "success":
      playTone(392, 0.12, "sine", 0.035);
      playTone(523.25, 0.14, "sine", 0.03, 0.02, 0.08);
      playTone(659.25, 0.18, "sine", 0.028, 0.02, 0.16);
      break;
    default: {
      const _exhaustive: never = sound;
      return _exhaustive;
    }
  }
}

export function soundForPreviewTone(
  tone: "mint" | "coral" | "volt" | "cream" | "signal",
): UiSound {
  switch (tone) {
    case "volt":
      return "chime";
    case "coral":
      return "tick";
    case "mint":
    case "cream":
    case "signal":
      return "slide";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}
