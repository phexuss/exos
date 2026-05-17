import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Skeleton } from '@/components/ui/Skeleton';
import { SourcePill } from '@/components/ui/SourcePill';
import { COLORS } from '@/constants/colors';
import type { SourceKey } from '@/constants/sources';
import { SPACING } from '@/constants/spacing';
import { FONT_FAMILY } from '@/constants/typography';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useI18n } from '@/hooks/useI18n';
import { searchSoundCloud, searchTracks } from '@/services/api/search';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

const SOURCE_KEYS: SourceKey[] = ['deezer', 'soundcloud'];
const DEBOUNCE_MS = 500;

function TrackSeparator() {
  return <View style={{ height: 12 }} />;
}

export default function SearchScreen() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<SourceKey | 'all'>(
    'all',
  );
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const accentColor = useDynamicAccent();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const effectiveSource =
          selectedSource === 'all' ? 'deezer' : selectedSource;
        const data =
          effectiveSource === 'soundcloud'
            ? await searchSoundCloud(q)
            : await searchTracks(q);
        setResults(data);
        setQueue(data);
      } catch (e) {
        if (__DEV__) console.warn('Search error:', e);
      } finally {
        setLoading(false);
      }
    },
    [setQueue, selectedSource],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults, selectedSource]);

  const filteredResults = useMemo(() => {
    if (selectedSource === 'all') return results;
    return results.filter((track) => track.source === selectedSource);
  }, [results, selectedSource]);

  const handlePlay = useCallback(
    (track: Track) => {
      play(track);
    },
    [play],
  );

  const renderTrack = useCallback<ListRenderItem<Track>>(
    ({ item }) => (
      <TrackItem
        track={item}
        onPress={handlePlay}
        showDownload
        isActive={currentTrackId === item.id}
        accentColor={accentColor}
      />
    ),
    [handlePlay, currentTrackId, accentColor],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);

  const ListHeader = (
    <View style={{ gap: SPACING.xxl }}>
      <View style={{ gap: 16 }}>
        <AppText variant="display" weight="bold">
          {t('common.search')}
        </AppText>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 0.5,
            borderColor: COLORS.border,
            borderRadius: 8,
            backgroundColor: COLORS.surface,
          }}
        >
          <AppIcon name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            placeholder={t('search.placeholder')}
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            style={{
              flex: 1,
              color: COLORS.textPrimary,
              fontSize: 14,
              fontFamily: FONT_FAMILY.regular,
              padding: 0,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          <Pressable onPress={() => setSelectedSource('all')}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 0.5,
                borderColor:
                  selectedSource === 'all' ? COLORS.accent : COLORS.border,
                backgroundColor:
                  selectedSource === 'all'
                    ? 'rgba(99, 102, 241, 0.12)'
                    : 'transparent',
              }}
            >
              <AppText
                variant="caption"
                weight="medium"
                style={{
                  color:
                    selectedSource === 'all' ? COLORS.accent : COLORS.textMuted,
                  letterSpacing: 0.5,
                }}
              >
                {t('common.all')}
              </AppText>
            </View>
          </Pressable>
          {SOURCE_KEYS.map((source) => (
            <Pressable key={source} onPress={() => setSelectedSource(source)}>
              <SourcePill
                source={source}
                selected={selectedSource === source}
              />
            </Pressable>
          ))}
        </View>
      </View>

      {query.trim() ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText
            variant="label"
            weight="medium"
            style={{
              color: COLORS.textSecondary,
              letterSpacing: 1,
              fontSize: 11,
            }}
          >
            {t('search.results').toUpperCase()}
          </AppText>
        </View>
      ) : null}
    </View>
  );

  const ListEmpty = loading ? (
    <View style={{ gap: 12, paddingTop: 8 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} width="100%" height={56} />
      ))}
    </View>
  ) : query.trim() ? (
    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
      <AppText variant="body" style={{ color: COLORS.textMuted }}>
        {t('search.noResults')}
      </AppText>
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlashList
        data={filteredResults}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        ListHeaderComponent={ListHeader}
        ListHeaderComponentStyle={{ marginBottom: 12 }}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={TrackSeparator}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
