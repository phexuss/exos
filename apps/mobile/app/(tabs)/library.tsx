import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedModal } from '@/components/AnimatedModal';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { FONT_FAMILY } from '@/constants/typography';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
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
  const handlePress = useCallback(() => {
    useOverlayStore.getState().openPlaylist(id);
  }, [id]);

  return (
    <Pressable onPress={handlePress} style={{ width: 120, gap: 8 }}>
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 12,
          }}
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
        {trackCount} tracks
      </AppText>
    </Pressable>
  );
}

const PlaylistCard = memo(PlaylistCardComponent);

function TrackSeparator() {
  return <View style={{ height: 12 }} />;
}

export default function LibraryScreen() {
  const { t } = useI18n();
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const accentColor = useDynamicAccent();

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

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([getDownloadedTracks(), getPlaylists()]);
      setTracks(t);
      setPlaylists(p);
    } catch (e) {
      if (__DEV__) console.warn('Library fetch error:', e);
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
    ({ item }) => (
      <TrackItem
        track={item}
        onPress={handlePlay}
        onLongPress={handleLongPress}
        isActive={currentTrackId === item.id}
        isSelected={selectedIds.has(item.id)}
        selectionMode={selectionMode}
        accentColor={accentColor}
      />
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
              Long press a track to create
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
          DOWNLOADED
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
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
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
              No downloads yet
            </AppText>
          </View>
        }
        ItemSeparatorComponent={TrackSeparator}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: selectionMode ? 150 : 100,
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
      {selectionMode ? (
        <View
          style={{
            position: 'absolute',
            left: SPACING.lg,
            right: SPACING.lg,
            bottom: SPACING.lg,
            borderRadius: 18,
            backgroundColor: COLORS.surfaceElevated,
            borderWidth: 0.5,
            borderColor: COLORS.border,
            height: 60,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Pressable
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
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="body" weight="bold" numberOfLines={1}>
              {selectedCount} selected
            </AppText>
            <AppText
              variant="caption"
              numberOfLines={1}
              style={{ color: COLORS.textMuted, fontSize: 11 }}
            >
              Downloaded tracks
            </AppText>
          </View>
          {selectedCount === 1 ? (
            <Pressable
              onPress={openSelectedActions}
              hitSlop={8}
              style={{
                height: 40,
                borderRadius: 10,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                backgroundColor: COLORS.surfaceMuted,
              }}
            >
              <AppIcon name="playlist" size={18} color={COLORS.textPrimary} />
              <AppText variant="caption" weight="medium">
                More
              </AppText>
            </Pressable>
          ) : null}
          {selectedCount > 1 ? (
            <Pressable
              onPress={() => setShowBulkPlaylists(true)}
              hitSlop={8}
              style={{
                height: 40,
                borderRadius: 10,
                paddingHorizontal: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
                backgroundColor: COLORS.surfaceMuted,
              }}
            >
              <AppIcon name="playlist" size={18} color={COLORS.textPrimary} />
              <AppText variant="caption" weight="medium">
                Playlist
              </AppText>
            </Pressable>
          ) : null}
          <Pressable
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
          </Pressable>
        </View>
      ) : null}

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
            Delete downloads?
          </AppText>
          <AppText
            variant="body"
            style={{ color: COLORS.textSecondary, lineHeight: 22 }}
          >
            Remove {selectedCount} selected tracks from this device.
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
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
              Cancel
            </AppText>
          </Pressable>
          <Pressable
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
              {deletingSelection ? 'Deleting...' : 'Delete'}
            </AppText>
          </Pressable>
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
            Add to playlist
          </AppText>
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            {selectedCount} selected tracks
          </AppText>
        </View>

        {showBulkCreatePlaylist ? (
          <View style={{ padding: 20, gap: 12 }}>
            <TextInput
              placeholder="Playlist name"
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
            <Pressable
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
                {addingSelection ? 'Adding...' : 'Create & Add'}
              </AppText>
            </Pressable>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 4 }}>
            <Pressable
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
                New Playlist
              </AppText>
            </Pressable>
            {playlists.map((playlist) => (
              <Pressable
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
                    {playlist.track_count} tracks
                  </AppText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </AnimatedModal>
    </SafeAreaView>
  );
}
