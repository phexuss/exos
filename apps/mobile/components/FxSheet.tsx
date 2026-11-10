import { useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { AnimatedModal } from '@/components/AnimatedModal';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppText } from '@/components/ui/AppText';
import { Segmented } from '@/components/ui/Segmented';
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
      <View>
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
              <AnimatedPressable
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
              </AnimatedPressable>
            ) : null}
          </View>

          <Segmented
            options={PRESETS.map((p) => ({ key: p, label: t(`fx.${p}`) }))}
            value={preset}
            onChange={(p) => setFx(FX_PRESETS[p])}
            accentColor={accentColor}
          />

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
      </View>
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
    <View style={{ gap: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
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
      <FxSlider
        progress={Math.min(1, Math.max(0, progress))}
        accentColor={accentColor}
        onScrub={onScrub}
        onCommit={onCommit}
        label={label}
      />
    </View>
  );
}

const THUMB = 18;
const TRACK = 4;
const SLIDER_HEIGHT = 36;

type FxSliderProps = {
  progress: number;
  accentColor: string;
  label: string;
  onScrub: (ratio: number | null) => void;
  onCommit: (ratio: number) => void;
};

/**
 * A plain slider on React Native's own touch system. The sheet lives in a
 * Modal, outside the app's gesture-handler root, where the player's seek bar
 * gestures never start; a responder works there like anywhere else. The thumb
 * stays inside the row, so its edges line up with the labels above.
 */
function FxSlider({
  progress,
  accentColor,
  label,
  onScrub,
  onCommit,
}: FxSliderProps) {
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const widthRef = useRef(0);
  const ratioRef = useRef(0);
  const startX = useRef(0);
  // Latest callbacks for the responder, which is built once.
  const cb = useRef({ onScrub, onCommit });
  cb.current = { onScrub, onCommit };

  const responder = useMemo(() => {
    const ratioAt = (x: number) => {
      const travel = widthRef.current - THUMB;
      if (travel <= 0) return 0;
      return Math.min(1, Math.max(0, (x - THUMB / 2) / travel));
    };
    const move = (x: number) => {
      const r = ratioAt(x);
      ratioRef.current = r;
      setDrag(r);
      cb.current.onScrub(r);
    };
    const end = (commit: boolean) => {
      if (commit) cb.current.onCommit(ratioRef.current);
      setDrag(null);
      cb.current.onScrub(null);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Keep the drag even when it wanders vertically.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        startX.current = e.nativeEvent.locationX;
        move(startX.current);
      },
      onPanResponderMove: (_e, g) => move(startX.current + g.dx),
      onPanResponderRelease: () => end(true),
      onPanResponderTerminate: () => end(true),
    });
  }, []);

  const shown = drag ?? progress;
  const travel = Math.max(0, width - THUMB);
  const thumbX = shown * travel;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(shown * 100) }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        widthRef.current = w;
        setWidth(w);
      }}
      {...responder.panHandlers}
      style={{ height: SLIDER_HEIGHT, justifyContent: 'center' }}
    >
      {/* Children ignore touches, so locationX is always the row's own. */}
      <View
        pointerEvents="none"
        style={{
          marginHorizontal: THUMB / 2,
          height: TRACK,
          borderRadius: TRACK / 2,
          backgroundColor: COLORS.divider,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: thumbX,
            height: TRACK,
            backgroundColor: accentColor,
          }}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: thumbX,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: COLORS.textPrimary,
        }}
      />
    </View>
  );
}
