import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';

type LyricLine = { time: number; text: string };

/** Boost a hex colour's saturation & lightness so lyrics pop on dark bg */
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

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  for (const line of lrc.split('\n')) {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + ms / 1000;
      const text = match[4].trim();
      if (text) lines.push({ time, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

const SPRING = { damping: 28, stiffness: 65, mass: 0.7 };
const GAP = 16;

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
    onSeek?.(time);
  }, [onSeek, time]);

  const scale = useSharedValue(isActive ? 1.04 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.35);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.04 : 1, SPRING);
    opacity.value = withSpring(
      isActive ? 1 : Math.max(0.2, 0.4 - distance * 0.04),
      SPRING,
    );
  }, [isActive, distance]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      disabled={!onSeek}
      onPress={handlePress}
      style={{ width: '100%', alignItems: 'center' }}
    >
      <Animated.View
        style={animStyle}
        onLayout={(e: LayoutChangeEvent) => {
          onMeasure?.(index, e.nativeEvent.layout.height);
        }}
      >
        <AppText
          variant="title"
          weight={isActive ? 'bold' : 'medium'}
          style={{
            color: isActive
              ? (accentVibrant ?? COLORS.accent)
              : COLORS.textPrimary,
            fontSize: isActive ? 22 : 18,
            lineHeight: isActive ? 32 : 27,
            textAlign: 'center',
            paddingHorizontal: 4,
            textShadowColor: isActive
              ? accentVibrant
                ? accentVibrant + 'CC'
                : 'rgba(129,140,248,0.45)'
              : 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: isActive ? (accentVibrant ? 22 : 12) : 0,
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
  progress: number;
  duration: number;
  onSeekToTime?: (seconds: number) => void;
  accentColor?: string;
};

export function LyricsView({
  syncedLyrics,
  plainLyrics,
  progress,
  duration,
  onSeekToTime,
  accentColor,
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

  // Reset scroll/measure state when lyrics change (new track)
  useEffect(() => {
    isFirstScrollRef.current = true;
    prevLineRef.current = -1;
    lineHeights.current = [];
  }, [parsedLines]);

  const accentVibrant = useMemo(
    () => (accentColor ? vibrateHex(accentColor) : undefined),
    [accentColor],
  );

  const currentTime = progress * duration;

  const currentLineIndex = useMemo(() => {
    if (!parsedLines) return -1;
    for (let i = parsedLines.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLines[i].time) return i;
    }
    return -1;
  }, [parsedLines, currentTime]);

  const handleMeasure = useCallback((index: number, height: number) => {
    lineHeights.current[index] = height + GAP;
  }, []);

  useEffect(() => {
    if (containerH <= 0 || currentLineIndex < 0 || !scrollRef.current)
      return;

    let offset = 0;
    for (let i = 0; i < currentLineIndex; i++) {
      offset += lineHeights.current[i] || 43;
    }
    // Place active line ~1/3 from top of container
    const targetY = Math.max(0, offset - containerH * 0.3);

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

  if (!syncedLyrics && !plainLyrics) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <AppText
          variant="body"
          style={{ color: COLORS.textMuted, textAlign: 'center' }}
        >
          {t('lyricsFaq.noLyrics')}
        </AppText>
        <Pressable onPress={() => setShowLyricsFaq(true)}>
          <AppText
            variant="caption"
            weight="medium"
            style={{ color: COLORS.accent, textDecorationLine: 'underline' }}
          >
            {t('lyricsFaq.why')}
          </AppText>
        </Pressable>
        <Modal
          visible={showLyricsFaq}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLyricsFaq(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowLyricsFaq(false)}
          >
            <Pressable
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 16,
                padding: 24,
                marginHorizontal: 32,
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
            </Pressable>
          </Pressable>
        </Modal>
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
            paddingTop: 20,
            paddingBottom: containerH * 0.5,
            paddingHorizontal: 12,
            gap: GAP,
            alignItems: 'center',
          }}
        >
          {parsedLines.map((line, i) => {
            const dist = Math.abs(i - currentLineIndex);
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
      </View>
    );
  }

  const plainLines = plainLyrics?.split('\n').filter((l) => l.trim()) ?? [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: 40,
          paddingHorizontal: 12,
          gap: 14,
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {plainLines.map((line, i) => (
          <AppText
            key={i}
            variant="title"
            weight="medium"
            style={{
              color: COLORS.textPrimary,
              fontSize: 18,
              lineHeight: 28,
              textAlign: 'center',
              opacity: 0.8,
            }}
          >
            {line}
          </AppText>
        ))}
      </ScrollView>
    </View>
  );
}
