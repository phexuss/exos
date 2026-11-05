import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedModal } from '@/components/AnimatedModal';
import { SeekBar } from '@/components/SeekBar';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { useI18n } from '@/hooks/useI18n';
import {
  FX_PRESETS,
  FX_SPEED_MAX,
  FX_SPEED_MIN,
  type FxPreset,
  presetOf,
} from '@/services/audio/fx';
import { useSettingsStore } from '@/store/useSettingsStore';

type FxSheetProps = {
  visible: boolean;
  onClose: () => void;
  accentColor: string;
};

const SPEED_RANGE = FX_SPEED_MAX - FX_SPEED_MIN;
const round = (v: number, step: number) => Math.round(v / step) * step;
const speedAt = (ratio: number) =>
  Math.round(round(FX_SPEED_MIN + ratio * SPEED_RANGE, 0.05) * 100) / 100;
const reverbAt = (ratio: number) => Math.round(round(ratio, 0.05) * 100) / 100;

const PRESETS: FxPreset[] = ['off', 'sped', 'slowed'];

/** Sped up / slowed + reverb, the desktop player's "Sound" popover. */
export function FxSheet({ visible, onClose, accentColor }: FxSheetProps) {
  const { t } = useI18n();
  const speed = useSettingsStore((s) => s.speed);
  const reverb = useSettingsStore((s) => s.reverb);
  const setFx = useSettingsStore((s) => s.setFx);
  // Live value while a slider is being dragged; committed on release.
  const [scrubSpeed, setScrubSpeed] = useState<number | null>(null);
  const [scrubReverb, setScrubReverb] = useState<number | null>(null);

  const shownSpeed = scrubSpeed ?? speed;
  const shownReverb = scrubReverb ?? reverb;
  const preset = presetOf({ speed, reverb });
  const active = speed !== 1 || reverb > 0;

  return (
    <AnimatedModal
      visible={visible}
      variant="sheet"
      onRequestClose={onClose}
      onBackdropPress={onClose}
      contentStyle={{
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: GLASS.radius.sheet,
        borderTopRightRadius: GLASS.radius.sheet,
        paddingBottom: 34,
      }}
    >
      {/* A Modal renders outside the app's gesture root on Android. */}
      <GestureHandlerRootView>
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: GLASS.rimStrong,
            }}
          />
        </View>

        <View style={{ paddingHorizontal: 20, gap: 18 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <AppText variant="title" weight="bold">
              {t('fx.title')}
            </AppText>
            {active ? (
              <Pressable
                hitSlop={10}
                onPress={() => setFx(FX_PRESETS.off)}
                accessibilityRole="button"
              >
                <AppText
                  variant="label"
                  weight="medium"
                  style={{ color: accentColor }}
                >
                  {t('fx.reset')}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <View
            style={{
              flexDirection: 'row',
              padding: 4,
              borderRadius: GLASS.radius.capsule,
              backgroundColor: COLORS.fill2,
            }}
            accessibilityRole="tablist"
          >
            {PRESETS.map((p) => {
              const on = preset === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setFx(FX_PRESETS[p])}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: GLASS.radius.capsule,
                    alignItems: 'center',
                    backgroundColor: on ? COLORS.accentSubtle : 'transparent',
                  }}
                >
                  <AppText
                    variant="label"
                    weight={on ? 'bold' : 'medium'}
                    numberOfLines={1}
                    style={{ color: on ? accentColor : COLORS.textSecondary }}
                  >
                    {t(`fx.${p}`)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <FxRow
            label={t('fx.speed')}
            value={`×${shownSpeed.toFixed(2)}`}
            progress={(shownSpeed - FX_SPEED_MIN) / SPEED_RANGE}
            accentColor={accentColor}
            onScrub={(r) => setScrubSpeed(r === null ? null : speedAt(r))}
            onCommit={(r) => setFx({ speed: speedAt(r) })}
          />
          <FxRow
            label={t('fx.reverb')}
            value={`${Math.round(shownReverb * 100)}%`}
            progress={shownReverb}
            accentColor={accentColor}
            onScrub={(r) => setScrubReverb(r === null ? null : reverbAt(r))}
            onCommit={(r) => setFx({ reverb: reverbAt(r) })}
          />

          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, lineHeight: 18 }}
          >
            {t('fx.hint')}
          </AppText>
        </View>
      </GestureHandlerRootView>
    </AnimatedModal>
  );
}

type FxRowProps = {
  label: string;
  value: string;
  progress: number;
  accentColor: string;
  onScrub: (ratio: number | null) => void;
  onCommit: (ratio: number) => void;
};

function FxRow({
  label,
  value,
  progress,
  accentColor,
  onScrub,
  onCommit,
}: FxRowProps) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="label" weight="medium">
          {label}
        </AppText>
        <AppText
          variant="label"
          style={{ color: COLORS.textSecondary, fontVariant: ['tabular-nums'] }}
        >
          {value}
        </AppText>
      </View>
      <SeekBar
        progress={Math.min(1, Math.max(0, progress))}
        accentColor={accentColor}
        onScrub={onScrub}
        onSeek={onCommit}
      />
    </View>
  );
}
