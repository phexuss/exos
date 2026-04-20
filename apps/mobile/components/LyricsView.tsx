import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';

type LyricLine = { time: number; text: string };

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

const SPRING = { damping: 24, stiffness: 100, mass: 0.8 };
const GAP = 16;

function SyncedLine({
  text,
  isActive,
  distance,
  onPress,
  onMeasure,
  index,
}: {
  text: string;
  isActive: boolean;
  distance: number;
  onPress?: () => void;
  onMeasure?: (index: number, height: number) => void;
  index: number;
}) {
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
      disabled={!onPress}
      onPress={onPress}
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
            color: isActive ? COLORS.accent : COLORS.textPrimary,
            fontSize: isActive ? 22 : 18,
            lineHeight: isActive ? 32 : 27,
            textAlign: 'center',
            paddingHorizontal: 4,
            textShadowColor: isActive ? 'rgba(129,140,248,0.45)' : 'transparent',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: isActive ? 12 : 0,
          }}
        >
          {text}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

type LyricsViewProps = {
  syncedLyrics?: string;
  plainLyrics?: string;
  progress: number;
  duration: number;
  onSeekToTime?: (seconds: number) => void;
};

export function LyricsView({
  syncedLyrics,
  plainLyrics,
  progress,
  duration,
  onSeekToTime,
}: LyricsViewProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lineHeights = useRef<number[]>([]);
  const prevLineRef = useRef(-1);
  const [containerH, setContainerH] = useState(300);

  const parsedLines = useMemo(() => {
    if (syncedLyrics) return parseLRC(syncedLyrics);
    return null;
  }, [syncedLyrics]);

  const currentTime = progress * duration;

  const currentLineIndex = useMemo(() => {
    if (!parsedLines) return -1;
    for (let i = parsedLines.length - 1; i >= 0; i--) {
      if (currentTime >= parsedLines[i].time) return i;
    }
    return -1;
  }, [parsedLines, currentTime]);

  const handleMeasure = (index: number, height: number) => {
    lineHeights.current[index] = height + GAP;
  };

  useEffect(() => {
    if (currentLineIndex < 0 || !scrollRef.current) return;

    let offset = 0;
    for (let i = 0; i < currentLineIndex; i++) {
      offset += lineHeights.current[i] || 43;
    }
    // Place active line ~1/3 from top of container
    const targetY = Math.max(0, offset - containerH * 0.3);

    const prev = prevLineRef.current;
    const goingBackward = currentLineIndex < prev;
    const bigJump = Math.abs(currentLineIndex - prev) > 4;

    scrollRef.current.scrollTo({
      y: targetY,
      animated: !goingBackward && !bigJump,
    });

    prevLineRef.current = currentLineIndex;
  }, [currentLineIndex, containerH]);

  if (!syncedLyrics && !plainLyrics) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <AppText
          variant="body"
          style={{ color: COLORS.textMuted, textAlign: 'center' }}
        >
          No lyrics yet
        </AppText>
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
                isActive={i === currentLineIndex}
                distance={dist}
                onPress={onSeekToTime ? () => onSeekToTime(line.time) : undefined}
                onMeasure={handleMeasure}
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
