import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedModal } from '@/components/AnimatedModal';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GlassAmbientBackground } from '@/components/glass/GlassAmbientBackground';
import { GlassSurface } from '@/components/glass/GlassSurface';
import { Presence } from '@/components/motion/Presence';
import { Rise } from '@/components/motion/Rise';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { FONT_FAMILY } from '@/constants/typography';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useGlassBottomInset } from '@/hooks/useGlassBottomInset';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
import {
  addTrackToPlaylist,
  createPlaylist,
  getDownloadedTracks,
  getPlaylists,
  type PlaylistRow,
} from '@/services/db/database';
import { deleteTrack } from '@/services/download/downloadService';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type SelectionBarProps = {
  visible: boolean;
  glass: boolean;
  bottom: number;
  children: ReactNode;
};

function SelectionBar({ visible, glass, bottom, children }: SelectionBarProps) {
  const rowStyle = {
    height: 60,
    paddingHorizontal: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  };

  return (
    <Presence
      visible={visible}
      from="rise"
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: SPACING.lg,
        right: SPACING.lg,
        bottom,
      }}
    >
      {glass ? (
        <GlassSurface
          floating
          variant="regular"
          style={{ borderRadius: GLASS.radius.capsule }}
          contentStyle={rowStyle}
        >
          {children}
        </GlassSurface>
      ) : (
        <View
          style={{
            ...rowStyle,
            borderRadius: GLASS.radius.capsule,
            backgroundColor: COLORS.surfaceElevated,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: GLASS.rim,
          }}
        >
          {children}
        </View>
      )}
    </Presence>
  );
}

type PlaylistCardProps = {
  id: string;
  name: string;
  coverUrl: string | null;
  trackCount: number;
};

function PlaylistCardComponent({
  id,
  name,
  coverUrl,
  trackCount,
}: PlaylistCardProps) {
  const { tn } = useI18n();
  const handlePress = useCallback(() => {
    useOverlayStore.getState().openPlaylist(id);
  }, [id]);

  return (
    <AnimatedPressable onPress={handlePress} style={{ width: 120, gap: 8 }}>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 12,
          }}
          transition={MOTION.dur.quick}
        />
      ) : (
        <View
          style={{
            width: 120,
            height: 120,
            borderRadius: 12,
            backgroundColor: COLORS.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="playlist" size={32} color={COLORS.textMuted} />
        </View>
      )}
      <AppText
        variant="caption"
        weight="medium"
        numberOfLines={1}
        style={{ color: COLORS.textPrimary }}
      >
        {name}
      </AppText>
      <AppText
        variant="caption"
        style={{
          color: COLORS.textMuted,
          fontSize: 11,
          marginTop: -6,
        }}
      >
        {tn('tracks', trackCount)}
      </AppText>
    </AnimatedPressable>
  );
}

const PlaylistCard = memo(PlaylistCardComponent);

function TrackSeparator() {
  return <View style={{ height: 12 }} />;
}

export default function LibraryScreen() {
  const { t, tn } = useI18n();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const accentColor = useDynamicAccent();
  const glassInset = useGlassBottomInset();
  const glassMode = useGlassMode();

  const downloadedIds = useDownloadStore((s) => s.downloadedIds);
  const playlistOverlayId = useOverlayStore((s) => s.playlistId);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkPlaylists, setShowBulkPlaylists] = useState(false);
  const [showBulkCreatePlaylist, setShowBulkCreatePlaylist] = useState(false);
  const [bulkPlaylistName, setBulkPlaylistName] = useState('');
  const [deletingSelection, setDeletingSelection] = useState(false);
  const [addingSelection, setAddingSelection] = useState(false);
  const selectedCount = selectedIds.size;
  const selectionMode = selectedCount > 0;

  const selectedTracks = useMemo(
    () => tracks.filter((track) => selectedIds.has(track.id)),
    [tracks, selectedIds],
  );

  const [loadFailed, setLoadFailed] = useState(false);
  // Focus, a finished download and closing a playlist can all ask for a
  // reload at once: run one read, then at most one more for the latest ask.
  const loading = useRef(false);
  const reloadAgain = useRef(false);

  const load = useCallback(async () => {
    if (loading.current) {
      reloadAgain.current = true;
      return;
    }
    loading.current = true;
    try {
      do {
        reloadAgain.current = false;
        try {
          const [t, p] = await Promise.all([
            getDownloadedTracks(),
            getPlaylists(),
          ]);
          setTracks(t);
          setPlaylists(p);
          setLoadFailed(false);
        } catch (e) {
          console.warn('[Library] Load failed:', e);
          setLoadFailed(true);
        }
      } while (reloadAgain.current);
    } finally {
      loading.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [downloadedIds, load]);

  useEffect(() => {
    if (!playlistOverlayId) {
      load();
    }
  }, [playlistOverlayId, load]);

  useEffect(() => {
    setSelectedIds((previous) => {
      if (previous.size === 0) return previous;
      const availableIds = new Set(tracks.map((track) => track.id));
      const next = new Set<string>();
      for (const id of previous) {
        if (availableIds.has(id)) next.add(id);
      }
      return next.size === previous.size ? previous : next;
    });
  }, [tracks]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedTrack(null);
    setShowBulkDelete(false);
    setShowBulkPlaylists(false);
    setShowBulkCreatePlaylist(false);
    setBulkPlaylistName('');
  }, []);

  const toggleTrackSelection = useCallback((track: Track) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(track.id)) {
        next.delete(track.id);
      } else {
        next.add(track.id);
      }
      return next;
    });
    void Haptics.selectionAsync();
  }, []);

  const handlePlay = useCallback(
    (track: Track) => {
      if (selectionMode) {
        toggleTrackSelection(track);
        return;
      }
      play(track);
      setQueue(tracks);
    },
    [selectionMode, toggleTrackSelection, play, setQueue, tracks],
  );

  const handleLongPress = useCallback(
    (track: Track) => {
      toggleTrackSelection(track);
    },
    [toggleTrackSelection],
  );

  const openSelectedActions = useCallback(() => {
    if (selectedTracks.length !== 1) return;
    setSelectedTrack(selectedTracks[0]);
  }, [selectedTracks]);

  const confirmBulkDelete = useCallback(async () => {
    if (deletingSelection || selectedTracks.length === 0) return;
    setDeletingSelection(true);
    try {
      for (const track of selectedTracks) {
        await deleteTrack(track.id);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearSelection();
      await load();
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (__DEV__) console.warn('[Delete] Bulk removal failed:', error);
    } finally {
      setDeletingSelection(false);
    }
  }, [deletingSelection, selectedTracks, clearSelection, load]);

  const addSelectionToPlaylist = useCallback(
    async (playlistId: string) => {
      if (addingSelection || selectedTracks.length === 0) return;
      setAddingSelection(true);
      try {
        for (const track of selectedTracks) {
          await addTrackToPlaylist(playlistId, track.id);
        }
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        clearSelection();
        await load();
      } catch (error) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (__DEV__) console.warn('[Playlist] Bulk add failed:', error);
      } finally {
        setAddingSelection(false);
      }
    },
    [addingSelection, selectedTracks, clearSelection, load],
  );

  const createPlaylistForSelection = useCallback(async () => {
    const name = bulkPlaylistName.trim();
    if (!name || addingSelection || selectedTracks.length === 0) return;
    setAddingSelection(true);
    try {
      const playlistId = await createPlaylist(name);
      for (const track of selectedTracks) {
        await addTrackToPlaylist(playlistId, track.id);
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearSelection();
      await load();
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (__DEV__) console.warn('[Playlist] Bulk create failed:', error);
    } finally {
      setAddingSelection(false);
    }
  }, [bulkPlaylistName, addingSelection, selectedTracks, clearSelection, load]);

  const renderTrack = useCallback<ListRenderItem<Track>>(
    ({ item, index }) => (
      <Rise index={index} after={1} animate={index <= MOTION.staggerCap}>
        <TrackItem
          track={item}
          onPress={handlePlay}
          onLongPress={handleLongPress}
          isActive={currentTrackId === item.id}
          isSelected={selectedIds.has(item.id)}
          selectionMode={selectionMode}
          accentColor={accentColor}
        />
      </Rise>
    ),
    [
      handlePlay,
      handleLongPress,
      currentTrackId,
      selectedIds,
      selectionMode,
      accentColor,
    ],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);

  const ListHeader = (
    <View style={{ gap: SPACING.xxl }}>
      <AppText variant="display" weight="bold">
        {t('library.title')}
      </AppText>

      <View style={{ gap: 12 }}>
        <AppText
          variant="label"
          weight="medium"
          style={{
            color: COLORS.textSecondary,
            letterSpacing: 1,
            fontSize: 11,
          }}
        >
          {t('library.playlists').toUpperCase()}
        </AppText>
        {playlists.length === 0 ? (
          <View
            style={{
              paddingVertical: 24,
              alignItems: 'center',
              gap: 8,
              borderTopWidth: 0.5,
              borderTopColor: COLORS.border,
            }}
          >
            <AppIcon name="playlist" size={24} color={COLORS.textMuted} />
            <AppText variant="caption" style={{ color: COLORS.textMuted }}>
              {t('library.longPressHint')}
            </AppText>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
            style={{
              marginHorizontal: -SPACING.lg,
              paddingHorizontal: SPACING.lg,
            }}
          >
            {playlists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                id={pl.id}
                name={pl.name}
                coverUrl={pl.cover_url}
                trackCount={pl.track_count}
              />
            ))}
          </ScrollView>
        )}
      </View>

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
          {t('library.downloadedSection').toUpperCase()}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 11 }}
        >
          {tracks.length}
        </AppText>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={{
        flex: 1,
        backgroundColor: glassMode ? 'transparent' : COLORS.background,
      }}
    >
      {glassMode ? <GlassAmbientBackground /> : null}
      <FlashList
        data={tracks}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        extraData={selectedIds}
        ListHeaderComponent={ListHeader}
        ListHeaderComponentStyle={{ marginBottom: 12 }}
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
            <AppIcon name="download" size={28} color={COLORS.textMuted} />
            <AppText variant="caption" style={{ color: COLORS.textMuted }}>
              {loadFailed ? t('common.loadFailed') : t('library.noDownloads')}
            </AppText>
            {loadFailed ? (
              <AnimatedPressable
                onPress={() => void load()}
                hitSlop={8}
                accessibilityRole="button"
              >
                <AppText
                  variant="label"
                  weight="medium"
                  style={{ color: COLORS.accent }}
                >
                  {t('common.retry')}
                </AppText>
              </AnimatedPressable>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={TrackSeparator}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: (selectionMode ? 150 : 100) + glassInset,
        }}
        showsVerticalScrollIndicator={false}
      />

      <TrackActionsSheet
        track={selectedTrack}
        visible={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
        onDeleted={() => {
          clearSelection();
          load();
        }}
      />
      <SelectionBar
        visible={selectionMode}
        glass={glassMode}
        bottom={SPACING.lg + glassInset}
      >
        <AnimatedPressable
          onPress={clearSelection}
          hitSlop={10}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="close" size={22} color={COLORS.textSecondary} />
        </AnimatedPressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {tn('selected', selectedCount)}
          </AppText>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{ color: COLORS.textMuted, fontSize: 11 }}
          >
            {t('library.downloadedTracks')}
          </AppText>
        </View>
        {selectedCount === 1 ? (
          <AnimatedPressable
            onPress={openSelectedActions}
            hitSlop={8}
            style={{
              height: 40,
              borderRadius: GLASS.radius.capsule,
              paddingHorizontal: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              backgroundColor: COLORS.fill2,
            }}
          >
            <AppIcon name="playlist" size={18} color={COLORS.textPrimary} />
            <AppText variant="caption" weight="medium">
              {t('library.more')}
            </AppText>
          </AnimatedPressable>
        ) : null}
        {selectedCount > 1 ? (
          <AnimatedPressable
            onPress={() => setShowBulkPlaylists(true)}
            hitSlop={8}
            style={{
              height: 40,
              borderRadius: GLASS.radius.capsule,
              paddingHorizontal: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              backgroundColor: COLORS.fill2,
            }}
          >
            <AppIcon name="playlist" size={18} color={COLORS.textPrimary} />
            <AppText variant="caption" weight="medium">
              {t('library.playlistAction')}
            </AppText>
          </AnimatedPressable>
        ) : null}
        <AnimatedPressable
          onPress={() => setShowBulkDelete(true)}
          hitSlop={8}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(248, 113, 113, 0.16)',
            borderWidth: 0.5,
            borderColor: 'rgba(248, 113, 113, 0.35)',
          }}
        >
          <AppIcon name="trash" size={18} color={COLORS.danger} />
        </AnimatedPressable>
      </SelectionBar>

      <AnimatedModal
        visible={showBulkDelete}
        onRequestClose={() => {
          if (!deletingSelection) setShowBulkDelete(false);
        }}
        onBackdropPress={() => setShowBulkDelete(false)}
        disableBackdropPress={deletingSelection}
        backdropStyle={{
          backgroundColor: 'rgba(0,0,0,0.62)',
          paddingHorizontal: SPACING.xxl,
        }}
        contentStyle={{
          backgroundColor: COLORS.surface,
          borderRadius: 18,
          borderWidth: 0.5,
          borderColor: COLORS.border,
          padding: 20,
          gap: 18,
        }}
      >
        <View style={{ gap: 8 }}>
          <AppText variant="title" weight="bold">
            {t('library.deleteDownloadsTitle')}
          </AppText>
          <AppText
            variant="body"
            style={{ color: COLORS.textSecondary, lineHeight: 22 }}
          >
            {t('library.deleteDownloadsMessage', {
              selected: tn('selectedTracks', selectedCount),
            })}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AnimatedPressable
            disabled={deletingSelection}
            onPress={() => setShowBulkDelete(false)}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: COLORS.surfaceMuted,
              opacity: deletingSelection ? 0.6 : 1,
            }}
          >
            <AppText variant="body" weight="medium">
              {t('common.cancel')}
            </AppText>
          </AnimatedPressable>
          <AnimatedPressable
            disabled={deletingSelection}
            onPress={confirmBulkDelete}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: 'rgba(248, 113, 113, 0.16)',
              borderWidth: 0.5,
              borderColor: 'rgba(248, 113, 113, 0.35)',
              opacity: deletingSelection ? 0.6 : 1,
            }}
          >
            <AppText
              variant="body"
              weight="medium"
              style={{ color: COLORS.danger }}
            >
              {deletingSelection ? t('common.deleting') : t('common.delete')}
            </AppText>
          </AnimatedPressable>
        </View>
      </AnimatedModal>

      <AnimatedModal
        visible={showBulkPlaylists}
        variant="sheet"
        onRequestClose={() => {
          if (!addingSelection) {
            setShowBulkPlaylists(false);
            setShowBulkCreatePlaylist(false);
            setBulkPlaylistName('');
          }
        }}
        onBackdropPress={() => {
          setShowBulkPlaylists(false);
          setShowBulkCreatePlaylist(false);
          setBulkPlaylistName('');
        }}
        disableBackdropPress={addingSelection}
        backdropStyle={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        contentStyle={{
          backgroundColor: COLORS.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 34,
        }}
      >
        <View style={{ alignItems: 'center', paddingVertical: 12 }}>
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: COLORS.border,
            }}
          />
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 10, gap: 4 }}>
          <AppText variant="title" weight="bold">
            {t('library.addToPlaylist')}
          </AppText>
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            {tn('selectedTracks', selectedCount)}
          </AppText>
        </View>

        {showBulkCreatePlaylist ? (
          <View style={{ padding: 20, gap: 12 }}>
            <TextInput
              maxFontSizeMultiplier={LAYOUT.maxFontScale}
              placeholder={t('library.playlistName')}
              placeholderTextColor={COLORS.textMuted}
              value={bulkPlaylistName}
              onChangeText={setBulkPlaylistName}
              autoFocus
              editable={!addingSelection}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 10,
                color: COLORS.textPrimary,
                fontFamily: FONT_FAMILY.regular,
                fontSize: 14,
              }}
            />
            <AnimatedPressable
              disabled={addingSelection || !bulkPlaylistName.trim()}
              onPress={createPlaylistForSelection}
              style={{
                backgroundColor: COLORS.accent,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                opacity: addingSelection || !bulkPlaylistName.trim() ? 0.6 : 1,
              }}
            >
              <AppText variant="body" weight="medium" style={{ color: '#fff' }}>
                {addingSelection
                  ? t('common.adding')
                  : t('library.createAndAdd')}
              </AppText>
            </AnimatedPressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 4 }}>
            <AnimatedPressable
              disabled={addingSelection}
              onPress={() => setShowBulkCreatePlaylist(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                borderBottomWidth: 0.5,
                borderBottomColor: COLORS.divider,
                opacity: addingSelection ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: COLORS.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppText variant="body" weight="bold" style={{ color: '#fff' }}>
                  +
                </AppText>
              </View>
              <AppText variant="body" weight="medium">
                {t('library.newPlaylist')}
              </AppText>
            </AnimatedPressable>
            {playlists.map((playlist) => (
              <AnimatedPressable
                key={playlist.id}
                disabled={addingSelection}
                onPress={() => addSelectionToPlaylist(playlist.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  borderBottomWidth: 0.5,
                  borderBottomColor: COLORS.divider,
                  opacity: addingSelection ? 0.6 : 1,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: COLORS.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppIcon name="playlist" size={18} color={COLORS.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" weight="medium" numberOfLines={1}>
                    {playlist.name}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{ color: COLORS.textMuted }}
                  >
                    {tn('tracks', playlist.track_count)}
                  </AppText>
                </View>
              </AnimatedPressable>
            ))}
          </View>
        )}
      </AnimatedModal>
    </SafeAreaView>
  );
}
