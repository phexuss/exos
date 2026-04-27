import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  type ListRenderItem,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { FONT_FAMILY } from '@/constants/typography';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import {
  getPlaylistTracks,
  getPlaylists,
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
    Alert.alert(
      'Remove from Playlist',
      `Remove "${selectedTrack.title}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeTrackFromPlaylist(id, selectedTrack.id);
            setSelectedTrack(null);
            load();
          },
        },
      ],
    );
  }, [selectedTrack, id, load]);

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

      <FlatList
        data={tracks}
        keyExtractor={keyExtractor}
        renderItem={renderTrack}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={11}
        removeClippedSubviews
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
        onClose={() => setSelectedTrack(null)}
        onDeleted={load}
        extraAction={{
          label: 'Remove from Playlist',
          icon: 'close',
          color: '#EF4444',
          onPress: handleRemoveFromPlaylist,
        }}
      />

      <Modal
        visible={showEdit}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEdit(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
          onPress={() => setShowEdit(false)}
        >
          <Pressable
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              padding: 20,
              gap: 16,
            }}
          >
            <AppText
              variant="title"
              weight="bold"
              style={{ textAlign: 'center' }}
            >
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
                <AppText
                  variant="body"
                  weight="medium"
                  style={{ color: '#fff' }}
                >
                  Save
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
