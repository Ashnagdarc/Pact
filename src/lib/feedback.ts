import { shouldMuteFeedback } from "@/lib/feedback-prefs";
import { playHaptic, type HapticPattern } from "@/lib/haptics";
import { playUiSound, type UiSound } from "@/lib/ui-sounds";

type FeedbackOptions = {
  sound?: UiSound;
  haptic?: HapticPattern;
};

export function playFeedback({ sound, haptic }: FeedbackOptions) {
  if (shouldMuteFeedback()) return;
  if (sound) playUiSound(sound);
  if (haptic) playHaptic(haptic);
}
