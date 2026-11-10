import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { PillButton } from '@/components/ui/PillButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import * as audio from '@/services/audio/audioService';
import { usePlayerStore } from '@/store/usePlayerStore';
import { haptic } from '@/utils/haptics';

type LyricLine = { time: number; text: string };

function vibrateHex(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s: number,
    l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  } else {
    s = 0;
  }
  s = Math.min(1, s * 1.5 + 0.2);
  l = Math.max(0.55, Math.min(0.75, l * 1.15 + 0.1));
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(hue2rgb(p, q, h + 1 / 3))}${toHex(hue2rgb(p, q, h))}${toHex(hue2rgb(p, q, h - 1 / 3))}`;
}

const LRC_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

/**
 * `[mm:ss.xx]` lines, plus what LRCLIB also serves: several tags on one
 * line (a repeated chorus), one-digit minutes, `[mm:ss:xx]`, no fraction,
 * and an `[offset:±ms]` header.
 */
function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const offsetMatch = lrc.match(/\[offset:\s*([+-]?\d+)\s*\]/i);
  // Positive offset = lyrics come sooner.
  const offset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0;
  for (const line of lrc.split('\n')) {
    const times: number[] = [];
    let rest = line;
    LRC_TAG.lastIndex = 0;
    for (const match of line.matchAll(LRC_TAG)) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const frac = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      times.push(Math.max(0, minutes * 60 + seconds + frac / 1000 - offset));
      rest = rest.replace(match[0], '');
    }
    const text = rest.trim();
    if (!text) continue;
    for (const time of times) lines.push({ time, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

/** Synced lyrics nobody could parse are still worth showing as text. */
function stripLrcTags(lrc: string): string {
  return lrc
    .split('\n')
    .map((l) => l.replace(/\[[^\]]*\]/g, '').trim())
    .join('\n');
}

/** Settles in about 400 ms with no bounce: lines trade places calmly. */
const SPRING = { damping: 26, stiffness: 170, mass: 1 };
const GAP = 18;
/** Lines past this many away from the sung one all look the same. */
const FAR = 5;
const LINE_REST_SCALE = 0.94;

const LINE_TEXT = {
  fontSize: 24,
  lineHeight: 31,
  letterSpacing: -0.3,
} as const;

function restOpacity(distance: number): number {
  return Math.max(0.22, 0.46 - distance * 0.06);
}

type SyncedLineProps = {
  text: string;
  time: number;
  isActive: boolean;
  distance: number;
  onSeek?: (time: number) => void;
  onMeasure?: (index: number, height: number) => void;
  index: number;
  accentVibrant?: string;
};

function SyncedLineComponent({
  text,
  time,
  isActive,
  distance,
  onSeek,
  onMeasure,
  index,
  accentVibrant,
}: SyncedLineProps) {
  const handlePress = useCallback(() => {
    haptic('tick');
    onSeek?.(time);
  }, [onSeek, time]);

  // React Native Animated on the native driver: a Reanimated value per line
  // would leave every line's props for Reanimated to re-apply on each commit.
  const [scale] = useState(
    () => new Animated.Value(isActive ? 1 : LINE_REST_SCALE),
  );
  const [opacity] = useState(
    () => new Animated.Value(isActive ? 1 : restOpacity(distance)),
  );

  useEffect(() => {
    const run = Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1 : LINE_REST_SCALE,
        ...SPRING,
        useNativeDriver: true,
      }),
      Animated.spring(opacity, {
        toValue: isActive ? 1 : restOpacity(distance),
        ...SPRING,
        useNativeDriver: true,
      }),
    ]);
    run.start();
    return () => run.stop();
  }, [isActive, distance, scale, opacity]);

  const animStyle = useMemo(
    () => ({
      transform: [{ scale }],
      transformOrigin: 'left center',
      opacity,
    }),
    [scale, opacity],
  );

  // Every line is set in the same size and weight and only its scale and
  // opacity change: the sung line grows without re-flowing the lines around
  // it, so the list never jumps and the scroll target stays true.
  return (
    <Pressable
      disabled={!onSeek}
      onPress={handlePress}
      style={{ width: '100%' }}
    >
      <Animated.View
        style={animStyle}
        onLayout={(e: LayoutChangeEvent) => {
          onMeasure?.(index, e.nativeEvent.layout.height);
        }}
      >
        <AppText
          variant="title"
          weight="bold"
          style={{
            ...LINE_TEXT,
            color: isActive
              ? (accentVibrant ?? COLORS.textPrimary)
              : COLORS.textPrimary,
          }}
        >
          {text}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const SyncedLine = memo(SyncedLineComponent);

type LyricsViewProps = {
  syncedLyrics?: string;
  plainLyrics?: string;
  /** Still looking the lyrics up. */
  loading?: boolean;
  /** Fallback when the player hasn't reported a duration yet. */
  duration: number;
  onSeekToTime?: (seconds: number) => void;
  accentColor?: string;
  /** Opens the lyrics editor; `find` when there are no lyrics yet. */
  onEdit?: (find: boolean) => void;
};

/** Small round pencil in the corner of the lyrics box. */
function EditButton({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
      }}
    >
      <AppIcon name="edit" size={17} color={COLORS.textSecondary} />
    </Pressable>
  );
}

/** Widths of the placeholder lines shown while lyrics are looked up. */
const LOADING_LINES = ['82%', '64%', '90%', '48%', '72%'] as const;

export function LyricsView({
  syncedLyrics,
  plainLyrics,
  loading,
  duration,
  onSeekToTime,
  accentColor,
  onEdit,
}: LyricsViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lineHeights = useRef<number[]>([]);
  const prevLineRef = useRef(-1);
  const isFirstScrollRef = useRef(true);
  const [containerH, setContainerH] = useState(0);

  const parsedLines = useMemo(() => {
    if (syncedLyrics) return parseLRC(syncedLyrics);
    return null;
  }, [syncedLyrics]);

  useEffect(() => {
    isFirstScrollRef.current = true;
    prevLineRef.current = -1;
    lineHeights.current = [];
  }, [parsedLines]);

  const accentVibrant = useMemo(
    () => (accentColor ? vibrateHex(accentColor) : undefined),
    [accentColor],
  );

  // Select the active line rather than the raw progress: progress ticks every
  // 250 ms, the line changes every few seconds, and only then do we re-render.
  const currentLineIndex = usePlayerStore((s) => {
    if (!parsedLines) return -1;
    const currentTime = s.progress * (audio.getDuration() || duration);
    for (let i = parsedLines.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLines[i].time) return i;
    }
    return -1;
  });

  const handleMeasure = useCallback((index: number, height: number) => {
    lineHeights.current[index] = height + GAP;
  }, []);

  useEffect(() => {
    if (containerH <= 0 || currentLineIndex < 0 || !scrollRef.current) return;

    let offset = 0;
    for (let i = 0; i < currentLineIndex; i++) {
      offset += lineHeights.current[i] || LINE_TEXT.lineHeight + GAP;
    }

    const targetY = Math.max(0, offset - containerH * 0.18);

    const prev = prevLineRef.current;
    const goingBackward = currentLineIndex < prev;
    const bigJump = Math.abs(currentLineIndex - prev) > 4;
    const isFirstScroll = isFirstScrollRef.current;

    scrollRef.current.scrollTo({
      y: targetY,
      animated: !isFirstScroll && !goingBackward && !bigJump,
    });

    isFirstScrollRef.current = false;
    prevLineRef.current = currentLineIndex;
  }, [currentLineIndex, containerH]);

  const { t } = useI18n();
  const [showLyricsFaq, setShowLyricsFaq] = useState(false);

  if (!syncedLyrics && !plainLyrics && loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', gap: GAP }}
        accessibilityLabel={t('lyricsFaq.loading')}
      >
        {LOADING_LINES.map((width) => (
          <Skeleton key={width} width={width} height={22} radius={8} />
        ))}
      </View>
    );
  }

  if (!syncedLyrics && !plainLyrics) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.md,
        }}
      >
        <AppIcon name="lyrics" size={36} color={COLORS.textMuted} />
        <AppText variant="title" weight="bold" style={{ textAlign: 'center' }}>
          {t('lyricsFaq.noLyrics')}
        </AppText>
        {onEdit ? (
          <View style={{ marginTop: SPACING.sm }}>
            <PillButton
              label={t('lyricsEditor.find')}
              tone="quiet"
              fill={false}
              onPress={() => onEdit(true)}
            />
          </View>
        ) : null}
        <Pressable onPress={() => setShowLyricsFaq(true)} hitSlop={SPACING.md}>
          <AppText
            variant="label"
            weight="medium"
            style={{ color: COLORS.textSecondary }}
          >
            {t('lyricsFaq.why')}
          </AppText>
        </Pressable>
        <AnimatedModal
          visible={showLyricsFaq}
          onRequestClose={() => setShowLyricsFaq(false)}
          onBackdropPress={() => setShowLyricsFaq(false)}
          backdropStyle={{ alignItems: 'center', paddingHorizontal: 32 }}
          contentStyle={{
            backgroundColor: COLORS.surface,
            borderRadius: 18,
            padding: 22,
            width: '100%',
            maxWidth: 340,
            gap: 12,
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppText
            variant="body"
            weight="bold"
            style={{ color: COLORS.accent, fontSize: 16 }}
          >
            {t('lyricsFaq.title')}
          </AppText>
          <AppText
            variant="body"
            style={{ color: COLORS.textSecondary, lineHeight: 20 }}
          >
            {t('lyricsFaq.body1')}
          </AppText>
          <AppText
            variant="body"
            style={{ color: COLORS.textSecondary, lineHeight: 20 }}
          >
            {t('lyricsFaq.body2')}
          </AppText>
          <Pressable
            onPress={() => setShowLyricsFaq(false)}
            style={{
              alignSelf: 'flex-end',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              marginTop: 4,
            }}
          >
            <AppText
              variant="caption"
              weight="medium"
              style={{ color: COLORS.accent }}
            >
              {t('lyricsFaq.dismiss')}
            </AppText>
          </Pressable>
        </AnimatedModal>
      </View>
    );
  }

  if (parsedLines && parsedLines.length > 0) {
    return (
      <View
        style={{ flex: 1 }}
        onLayout={(e) => setContainerH(e.nativeEvent.layout.height)}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: containerH * 0.12,
            paddingBottom: containerH * 0.6,
            gap: GAP,
          }}
        >
          {parsedLines.map((line, i) => {
            const dist = Math.min(Math.abs(i - currentLineIndex), FAR);
            return (
              <SyncedLine
                key={i}
                index={i}
                text={line.text}
                time={line.time}
                isActive={i === currentLineIndex}
                distance={dist}
                onSeek={onSeekToTime}
                onMeasure={handleMeasure}
                accentVibrant={accentVibrant}
              />
            );
          })}
        </ScrollView>
        {onEdit ? (
          <EditButton
            onPress={() => onEdit(false)}
            label={t('lyricsEditor.edit')}
          />
        ) : null}
      </View>
    );
  }

  const plainText =
    plainLyrics || (syncedLyrics ? stripLrcTags(syncedLyrics) : '');
  const plainLines = plainText.split('\n').filter((l) => l.trim());

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: SPACING.xxl,
          gap: GAP,
          flexGrow: 1,
          justifyContent: 'center',
        }}
      >
        {plainLines.map((line, i) => (
          <AppText
            key={i}
            variant="title"
            weight="bold"
            style={{ ...LINE_TEXT, opacity: 0.85 }}
          >
            {line}
          </AppText>
        ))}
      </ScrollView>
      {onEdit ? (
        <EditButton
          onPress={() => onEdit(false)}
          label={t('lyricsEditor.edit')}
        />
      ) : null}
    </View>
  );
}
