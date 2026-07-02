import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AppDialog } from '@/components/AppDialog';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS } from '@/constants/colors';
import { FONT_FAMILY } from '@/constants/typography';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import {
  deletePlaylist,
  getPlaylists,
  getPlaylistTracks,
  type PlaylistRow,
  removeTrackFromPlaylist,
  renamePlaylist,
  updatePlaylistCover,
} from '@/services/db/database';
import { useOverlayStore } from '@/store/useOverlayStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type PlaylistScreenProps = {
  id: string;
};

export function PlaylistScreen({ id }: PlaylistScreenProps) {
  const play = usePlayerStore((s) => s.play);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack?.id);
  const closePlaylist = useOverlayStore((s) => s.closePlaylist);
  const accentColor = useDynamicAccent();

  const [playlist, setPlaylist] = useState<PlaylistRow | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCover, setEditCover] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPlaylist, setDeletingPlaylist] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removingTrack, setRemovingTrack] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const pls = await getPlaylists();
    setPlaylist(pls.find((p) => p.id === id) ?? null);
    const t = await getPlaylistTracks(id);
    setTracks(t);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePlay = useCallback(
    (track: Track) => {
      play(track);
      setQueue(tracks);
    },
    [play, setQueue, tracks],
  );

  const handleLongPress = useCallback(
    (track: Track) => setSelectedTrack(track),
    [],
  );

  const renderTrack = useCallback<ListRenderItem<Track>>(
    ({ item }) => (
      <TrackItem
        track={item}
        onPress={handlePlay}
        onLongPress={handleLongPress}
        isActive={currentTrackId === item.id}
        accentColor={accentColor}
      />
    ),
    [handlePlay, handleLongPress, currentTrackId, accentColor],
  );

  const keyExtractor = useCallback((item: Track) => item.id, []);

  const handleRemoveFromPlaylist = useCallback(() => {
    if (!selectedTrack || !id) return;
    setRemoveError(null);
    setShowRemoveConfirm(true);
  }, [selectedTrack, id]);

  const confirmRemoveFromPlaylist = useCallback(async () => {
    if (!selectedTrack || !id || removingTrack) return;

    setRemovingTrack(true);
    setRemoveError(null);
    try {
      await removeTrackFromPlaylist(id, selectedTrack.id);
      setShowRemoveConfirm(false);
      setSelectedTrack(null);
      load();
    } catch (error) {
      if (__DEV__) console.warn('[Playlist] Remove track failed:', error);
      setRemoveError('Could not remove track from playlist.');
    } finally {
      setRemovingTrack(false);
    }
  }, [selectedTrack, id, removingTrack, load]);

  const openEditModal = useCallback(() => {
    if (!playlist) return;
    setEditName(playlist.name);
    setEditCover(playlist.cover_url);
    setShowEdit(true);
  }, [playlist]);

  const handleSaveEdit = useCallback(async () => {
    if (!id || !playlist) return;
    const trimmed = editName.trim();
    if (trimmed && trimmed !== playlist.name) {
      await renamePlaylist(id, trimmed);
    }
    if (editCover !== playlist.cover_url) {
      await updatePlaylistCover(id, editCover);
    }
    setShowEdit(false);
    load();
  }, [id, playlist, editName, editCover, load]);

  const handleDeletePlaylist = useCallback(() => {
    setDeleteError(null);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeletePlaylist = useCallback(async () => {
    if (!id || !playlist || deletingPlaylist) return;

    setDeletingPlaylist(true);
    setDeleteError(null);
    try {
      await deletePlaylist(id);
      setShowDeleteConfirm(false);
      setShowEdit(false);
      closePlaylist();
    } catch (error) {
      if (__DEV__) console.warn('[Playlist] Delete failed:', error);
      setDeleteError('Could not delete playlist.');
    } finally {
      setDeletingPlaylist(false);
    }
  }, [id, playlist, deletingPlaylist, closePlaylist]);

  const pickCoverFromGallery = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setEditCover(result.assets[0].uri);
    }
  }, []);

  if (!playlist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 60, gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="100%" height={56} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={['top']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Pressable onPress={closePlaylist} hitSlop={12}>
          <AppIcon name="chevron-right" size={24} color={COLORS.textMuted} />
        </Pressable>
        <AppText
          variant="body"
          weight="bold"
          numberOfLines={1}
          style={{ flex: 1, textAlign: 'center', marginHorizontal: 12 }}
        >
          {playlist.name}
        </AppText>
        <Pressable onPress={openEditModal} hitSlop={12}>
          <AppIcon name="settings" size={20} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <AppText variant="caption" style={{ color: COLORS.textMuted }}>
          {tracks.length} tracks
        </AppText>
      </View>

      <FlashList
        data={tracks}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 80,
              gap: 8,
            }}
          >
            <AppIcon name="music" size={32} color={COLORS.textMuted} />
            <AppText variant="body" style={{ color: COLORS.textMuted }}>
              No tracks in this playlist
            </AppText>
          </View>
        }
      />

      <TrackActionsSheet
        track={selectedTrack}
        visible={!!selectedTrack}
        onClose={() => {
          setShowRemoveConfirm(false);
          setSelectedTrack(null);
        }}
        onDeleted={load}
        extraAction={{
          label: 'Remove from Playlist',
          icon: 'close',
          color: '#EF4444',
          onPress: handleRemoveFromPlaylist,
        }}
      />

      <AppDialog
        visible={showRemoveConfirm}
        title="Remove from playlist?"
        message={
          selectedTrack
            ? `Remove "${selectedTrack.title}" from this playlist?`
            : null
        }
        error={removeError}
        cancelLabel="Cancel"
        confirmLabel="Remove"
        busyLabel="Removing..."
        confirmTone="danger"
        busy={removingTrack}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={confirmRemoveFromPlaylist}
      />

      <AnimatedModal
        visible={showEdit}
        onRequestClose={() => setShowEdit(false)}
        onBackdropPress={() => setShowEdit(false)}
        backdropStyle={{ paddingHorizontal: 24 }}
        contentStyle={{
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          padding: 20,
          gap: 16,
        }}
      >
        <AppText variant="title" weight="bold" style={{ textAlign: 'center' }}>
          Edit Playlist
        </AppText>

        <Pressable
          onPress={pickCoverFromGallery}
          style={{ alignSelf: 'center' }}
        >
          {editCover ? (
            <Image
              source={{ uri: editCover }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 12,
              }}
            />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 12,
                backgroundColor: COLORS.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                borderStyle: 'dashed',
              }}
            >
              <AppIcon name="music" size={32} color={COLORS.textMuted} />
              <AppText
                variant="caption"
                style={{
                  color: COLORS.textMuted,
                  marginTop: 4,
                  fontSize: 10,
                }}
              >
                Add Cover
              </AppText>
            </View>
          )}
        </Pressable>

        <TextInput
          value={editName}
          onChangeText={setEditName}
          placeholder="Playlist name"
          placeholderTextColor={COLORS.textMuted}
          autoFocus
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: COLORS.textPrimary,
            fontFamily: FONT_FAMILY.regular,
            fontSize: 15,
          }}
        />

        <Pressable
          onPress={handleDeletePlaylist}
          style={{
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
            backgroundColor: 'rgba(248, 113, 113, 0.16)',
            borderWidth: 0.5,
            borderColor: 'rgba(248, 113, 113, 0.35)',
          }}
        >
          <AppText
            variant="body"
            weight="medium"
            style={{ color: COLORS.danger }}
          >
            Delete Playlist
          </AppText>
        </Pressable>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={() => setShowEdit(false)}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: COLORS.surfaceMuted,
            }}
          >
            <AppText
              variant="body"
              weight="medium"
              style={{ color: COLORS.textSecondary }}
            >
              Cancel
            </AppText>
          </Pressable>
          <Pressable
            onPress={handleSaveEdit}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: COLORS.accent,
            }}
          >
            <AppText variant="body" weight="medium" style={{ color: '#fff' }}>
              Save
            </AppText>
          </Pressable>
        </View>
      </AnimatedModal>

      <AppDialog
        visible={showDeleteConfirm}
        title="Delete playlist?"
        message={`Delete "${playlist.name}"? Tracks will stay downloaded.`}
        error={deleteError}
        cancelLabel="Cancel"
        confirmLabel="Delete"
        busyLabel="Deleting..."
        confirmTone="danger"
        busy={deletingPlaylist}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeletePlaylist}
      />
    </SafeAreaView>
  );
}
