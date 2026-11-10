import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { PillButton } from '@/components/ui/PillButton';
import { Segmented } from '@/components/ui/Segmented';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { LAYOUT } from '@/constants/layout';
import { FONT_FAMILY } from '@/constants/typography';
import { useI18n } from '@/hooks/useI18n';
import {
  type LrclibEntry,
  searchLyricsDirect,
} from '@/services/engine/localEngine';
import { plainFrom, readLyrics } from '@/services/lyrics/lrc';
import { useUserLyricsStore } from '@/store/useUserLyricsStore';
import type { Track } from '@/types/domain';

type Mode = 'text' | 'find';

/** LRCLIB entries within this many seconds of the track are marked as the same recording. */
const NEAR_LENGTH_S = 3;

function primaryArtist(artist: string): string {
  return artist.split(/\s*[&,]\s*|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim();
}

function formatTime(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

type LyricsEditorProps = {
  visible: boolean;
  track: Track;
  durationSec: number;
  /** What the player shows right now; the editor starts from it. */
  syncedLyrics?: string;
  plainLyrics?: string;
  /** The shown lyrics were set by hand, so they can be dropped. */
  custom: boolean;
  /** Open straight on the LRCLIB search (the track has no lyrics). */
  startOnFind?: boolean;
  accentColor: string;
  onClose: () => void;
};

/**
 * The desktop lyrics editor, minus tap-along sync and file import: paste or
 * edit lyrics by hand, or pick an LRCLIB result yourself.
 */
export function LyricsEditor({
  visible,
  track,
  durationSec,
  syncedLyrics,
  plainLyrics,
  custom,
  startOnFind,
  accentColor,
  onClose,
}: LyricsEditorProps) {
  const { t, tn } = useI18n();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const parsed = useMemo(() => readLyrics(text), [text]);

  // Each opening starts over from what the player showed when it was opened.
  // biome-ignore lint/correctness/useExhaustiveDependencies: on open only
  useEffect(() => {
    if (!visible) return;
    setText(syncedLyrics?.trim() || plainLyrics?.trim() || '');
    setMode(startOnFind ? 'find' : 'text');
    setError(null);
  }, [visible]);

  const save = async () => {
    if (parsed.kind === 'empty' || busy) return;
    setBusy(true);
    setError(null);
    try {
      await useUserLyricsStore
        .getState()
        .save(
          track.id,
          parsed.kind === 'synced'
            ? { syncedLyrics: parsed.lrc, plainLyrics: plainFrom(parsed.lrc) }
            : { syncedLyrics: null, plainLyrics: parsed.text },
        );
      onClose();
    } catch {
      setError(t('lyricsEditor.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await useUserLyricsStore.getState().remove(track.id);
      onClose();
    } catch {
      setError(t('lyricsEditor.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const status =
    parsed.kind === 'synced'
      ? `${t(parsed.from === 'srt' ? 'lyricsEditor.kindSrt' : 'lyricsEditor.kindSynced')} · ${tn('lines', parsed.lines.length)}`
      : parsed.kind === 'plain'
        ? `${t('lyricsEditor.kindPlain')} · ${tn('lines', parsed.lines.length)}`
        : '';

  return (
    <AnimatedModal
      visible={visible}
      variant="sheet"
      onRequestClose={onClose}
      onBackdropPress={onClose}
      contentStyle={{
        flex: 1,
        marginTop: insets.top + 24,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: GLASS.radius.sheet,
        borderTopRightRadius: GLASS.radius.sheet,
        paddingTop: 18,
        paddingHorizontal: 18,
        paddingBottom: 16,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title" weight="bold">
            {t('lyricsEditor.title')}
          </AppText>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{ color: COLORS.textSecondary }}
          >
            {track.title} · {track.artist.name}
          </AppText>
        </View>
        <Pressable
          hitSlop={10}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
        >
          <AppIcon name="close" size={24} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      <Segmented
        options={[
          { key: 'text', label: t('lyricsEditor.tabText') },
          { key: 'find', label: t('lyricsEditor.tabFind') },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'text' ? (
        <>
          <TextInput
            maxFontSizeMultiplier={LAYOUT.maxFontScale}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
            autoCorrect={false}
            spellCheck={false}
            placeholder={t('lyricsEditor.placeholder')}
            placeholderTextColor={COLORS.textMuted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: COLORS.border,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 12,
              color: COLORS.textPrimary,
              fontFamily:
                parsed.kind === 'synced' ? 'monospace' : FONT_FAMILY.regular,
              fontSize: parsed.kind === 'synced' ? 13 : 15,
              lineHeight: parsed.kind === 'synced' ? 20 : 22,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 20,
            }}
          >
            <AppText
              variant="caption"
              style={{
                flex: 1,
                color: error ? COLORS.danger : COLORS.textMuted,
              }}
            >
              {error ?? status}
            </AppText>
            {parsed.kind === 'synced' ? (
              <Pressable
                hitSlop={8}
                onPress={() => setText(plainFrom(text))}
                accessibilityRole="button"
              >
                <AppText
                  variant="caption"
                  weight="medium"
                  style={{ color: accentColor }}
                >
                  {t('lyricsEditor.stripTimes')}
                </AppText>
              </Pressable>
            ) : null}
            {custom ? (
              <Pressable
                hitSlop={8}
                onPress={restore}
                disabled={busy}
                accessibilityRole="button"
              >
                <AppText
                  variant="caption"
                  weight="medium"
                  style={{ color: accentColor }}
                >
                  {t('lyricsEditor.restore')}
                </AppText>
              </Pressable>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PillButton
              label={t('common.cancel')}
              tone="quiet"
              onPress={onClose}
            />
            <PillButton
              label={t('lyricsEditor.save')}
              tone="accent"
              disabled={parsed.kind === 'empty' || busy}
              onPress={save}
            />
          </View>
        </>
      ) : (
        <Finder
          track={track}
          durationSec={durationSec}
          accentColor={accentColor}
          onUse={(lyrics) => {
            setText(lyrics);
            setMode('text');
          }}
        />
      )}
    </AnimatedModal>
  );
}

/* ---------- LRCLIB search ---------- */

type FindState =
  | { status: 'loading' }
  | { status: 'done'; hits: LrclibEntry[] }
  | { status: 'error'; error: string };

function Finder({
  track,
  durationSec,
  accentColor,
  onUse,
}: {
  track: Track;
  durationSec: number;
  accentColor: string;
  onUse: (lyrics: string) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState(
    `${primaryArtist(track.artist.name)} ${track.title}`,
  );
  const [state, setState] = useState<FindState>({ status: 'loading' });
  const [picked, setPicked] = useState<LrclibEntry | null>(null);
  const seq = useRef(0);

  const isNear = (h: LrclibEntry) =>
    durationSec > 0 &&
    !!h.duration &&
    Math.abs(h.duration - durationSec) <= NEAR_LENGTH_S;

  const run = async () => {
    const q = query.trim();
    if (!q) return;
    const id = ++seq.current;
    setPicked(null);
    setState({ status: 'loading' });
    try {
      const hits = await searchLyricsDirect(q);
      if (id !== seq.current) return;
      // Same recording first, then synced before plain.
      hits.sort(
        (a, b) =>
          Number(isNear(b)) - Number(isNear(a)) ||
          Number(!!b.syncedLyrics) - Number(!!a.syncedLyrics),
      );
      setState({ status: 'done', hits });
    } catch (e) {
      if (id !== seq.current) return;
      setState({
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  // The first search runs on its own with the track's artist and title.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, on open
  useEffect(() => {
    void run();
    return () => {
      seq.current++;
    };
  }, []);

  if (picked) {
    const preview = picked.syncedLyrics
      ? plainFrom(picked.syncedLyrics)
      : (picked.plainLyrics ?? '');
    return (
      <>
        <Pressable
          hitSlop={8}
          onPress={() => setPicked(null)}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <AppIcon name="chevron-left" size={18} color={accentColor} />
          <AppText
            variant="label"
            weight="medium"
            style={{ color: accentColor }}
          >
            {t('lyricsEditor.back')}
          </AppText>
        </Pressable>
        <HitSummary hit={picked} near={isNear(picked)} />
        <ScrollView
          style={{
            flex: 1,
            borderRadius: 14,
            backgroundColor: COLORS.fill1,
          }}
          contentContainerStyle={{ padding: 14 }}
        >
          <AppText
            variant="body"
            style={{ color: COLORS.textSecondary, lineHeight: 22 }}
          >
            {preview}
          </AppText>
        </ScrollView>
        <View style={{ flexDirection: 'row' }}>
          <PillButton
            label={t('lyricsEditor.use')}
            tone="accent"
            onPress={() =>
              onUse(
                picked.syncedLyrics?.trim() || picked.plainLyrics?.trim() || '',
              )
            }
          />
        </View>
      </>
    );
  }

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: GLASS.radius.capsule,
            paddingHorizontal: 14,
          }}
        >
          <AppIcon name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            maxFontSizeMultiplier={LAYOUT.maxFontScale}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={run}
            returnKeyType="search"
            autoCorrect={false}
            placeholder={t('lyricsEditor.findPlaceholder')}
            placeholderTextColor={COLORS.textMuted}
            style={{
              flex: 1,
              paddingVertical: 10,
              color: COLORS.textPrimary,
              fontFamily: FONT_FAMILY.regular,
              fontSize: 15,
            }}
          />
        </View>
        <PillButton
          label={t('lyricsEditor.search')}
          tone="quiet"
          fill={false}
          disabled={!query.trim() || state.status === 'loading'}
          onPress={run}
        />
      </View>

      {state.status === 'loading' ? (
        <Centered>
          <ActivityIndicator color={accentColor} />
          <AppText variant="body" style={{ color: COLORS.textMuted }}>
            {t('lyricsEditor.finding')}
          </AppText>
        </Centered>
      ) : state.status === 'error' ? (
        <Centered>
          <AppText
            variant="body"
            style={{ color: COLORS.textMuted, textAlign: 'center' }}
          >
            {t('lyricsEditor.findFailed', { error: state.error })}
          </AppText>
        </Centered>
      ) : state.hits.length === 0 ? (
        <Centered>
          <AppText
            variant="body"
            style={{ color: COLORS.textMuted, textAlign: 'center' }}
          >
            {t('lyricsEditor.findNothing')}
          </AppText>
        </Centered>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={state.hits}
          keyExtractor={(h) => String(h.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 6 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setPicked(item)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                padding: 12,
                borderRadius: 14,
                backgroundColor: pressed ? COLORS.fill2 : COLORS.fill1,
              })}
            >
              <HitSummary hit={item} near={isNear(item)} />
            </Pressable>
          )}
        />
      )}
    </>
  );
}

function HitSummary({ hit, near }: { hit: LrclibEntry; near: boolean }) {
  const { t } = useI18n();
  return (
    <View style={{ gap: 4 }}>
      <AppText variant="body" weight="medium" numberOfLines={1}>
        {hit.trackName}
      </AppText>
      <AppText
        variant="caption"
        numberOfLines={1}
        style={{ color: COLORS.textSecondary }}
      >
        {hit.artistName}
        {hit.albumName ? ` · ${hit.albumName}` : ''}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: GLASS.radius.capsule,
            backgroundColor: hit.syncedLyrics
              ? 'rgba(129,140,248,0.18)'
              : COLORS.fill2,
          }}
        >
          <AppText
            variant="caption"
            weight="medium"
            style={{
              fontSize: 11,
              color: hit.syncedLyrics ? COLORS.accent : COLORS.textSecondary,
            }}
          >
            {t(
              hit.syncedLyrics
                ? 'lyricsEditor.badgeSynced'
                : 'lyricsEditor.badgePlain',
            )}
          </AppText>
        </View>
        {hit.duration ? (
          <AppText
            variant="caption"
            style={{ fontSize: 11, color: COLORS.textMuted }}
          >
            {formatTime(hit.duration)}
          </AppText>
        ) : null}
        {near ? (
          <AppText
            variant="caption"
            style={{ fontSize: 11, color: COLORS.textMuted }}
          >
            {t('lyricsEditor.nearLength')}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 12,
      }}
    >
      {children}
    </View>
  );
}
