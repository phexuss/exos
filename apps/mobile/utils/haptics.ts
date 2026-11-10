import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * What a touch feels like:
 * - `tap` — a button that does something now (play, skip, a tab).
 * - `tick` — a value passing a step (a toggle, a seek landing, a swipe committing).
 * - `on` / `off` — a switch flipping.
 * - `hold` — a long press taking effect.
 */
export type HapticKind = 'tap' | 'tick' | 'on' | 'off' | 'hold';

const ANDROID: Record<HapticKind, Haptics.AndroidHaptics> = {
  tap: Haptics.AndroidHaptics.Virtual_Key,
  tick: Haptics.AndroidHaptics.Clock_Tick,
  on: Haptics.AndroidHaptics.Toggle_On,
  off: Haptics.AndroidHaptics.Toggle_Off,
  hold: Haptics.AndroidHaptics.Long_Press,
};

/**
 * One short touch response. On Android it goes through the system haptic
 * constants, so it follows the phone's own "touch feedback" switch and uses
 * the crisp effects of its vibration motor instead of a raw buzz.
 */
export function haptic(kind: HapticKind = 'tap'): void {
  if (Platform.OS === 'web') return;
  const run =
    Platform.OS === 'android'
      ? Haptics.performAndroidHapticsAsync(ANDROID[kind]).catch(() =>
          // The toggle effects only exist from Android 14.
          Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick),
        )
      : kind === 'tap' || kind === 'hold'
        ? Haptics.impactAsync(
            kind === 'hold'
              ? Haptics.ImpactFeedbackStyle.Medium
              : Haptics.ImpactFeedbackStyle.Light,
          )
        : Haptics.selectionAsync();
  run.catch(() => {});
}
