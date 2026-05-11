import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { FONT_FAMILY } from '@/constants/typography';
import {
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
  type PlaylistRow,
} from '@/services/db/database';
import { deleteTrack } from '@/services/download/downloadService';
import type { Track } from '@/types/domain';

type ExtraAction = {
  label: string;
  icon: IconName;
  color?: string;
  onPress: () => void;
};

type Props = {
  track: Track | null;
  visible: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  extraAction?: ExtraAction;
};

export function TrackActionsSheet({
  track,
  visible,
  onClose,
  onDeleted,
  extraAction,
}: Props) {
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newName, setNewName] = useState('');
  const [presentedTrack, setPresentedTrack] = useState<Track | null>(track);

  useEffect(() => {
    if (visible) {
      getPlaylists().then(setPlaylists);
    } else {
      setShowPlaylists(false);
      setShowCreate(false);
      setShowDeleteConfirm(false);
      setDeleting(false);
      setNewName('');
    }
  }, [visible]);

  useEffect(() => {
    if (track) setPresentedTrack(track);
  }, [track]);

  const handleDelete = useCallback(() => {
    if (!track) return;
    setShowDeleteConfirm(true);
    void Haptics.selectionAsync();
  }, [track]);

  const confirmDelete = useCallback(async () => {
    if (!track || deleting) return;
    setDeleting(true);
    try {
      await deleteTrack(track.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onDeleted?.();
      onClose();
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (__DEV__) console.warn('[Delete] Track removal failed:', error);
      setDeleting(false);
    }
  }, [track, deleting, onDeleted, onClose]);

  const handleAddToPlaylist = useCallback(
    async (playlistId: string) => {
      if (!track) return;
      await addTrackToPlaylist(playlistId, track.id);
      onClose();
    },
    [track, onClose],
  );

  const handleCreatePlaylist = useCallback(async () => {
    if (!newName.trim() || !track) return;
    const id = await createPlaylist(newName.trim());
    await addTrackToPlaylist(id, track.id);
    onClose();
  }, [newName, track, onClose]);

  const activeTrack = track ?? presentedTrack;

  if (!activeTrack) return null;

  return (
    <AnimatedModal
      visible={visible}
      variant="sheet"
      onRequestClose={onClose}
      onBackdropPress={onClose}
      backdropStyle={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      contentStyle={{
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: COLORS.border,
          }}
        />
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <AppText variant="body" weight="bold" numberOfLines={1}>
          {activeTrack.title}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted }}
          numberOfLines={1}
        >
          {activeTrack.artist.name}
        </AppText>
      </View>

      {showDeleteConfirm ? (
        <View style={{ padding: 20, gap: 18 }}>
          <View style={{ gap: 8 }}>
            <AppText variant="title" weight="bold">
              Delete download?
            </AppText>
            <AppText
              variant="body"
              style={{ color: COLORS.textSecondary, lineHeight: 22 }}
            >
              Remove "{activeTrack.title}" from this device.
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              disabled={deleting}
              onPress={() => setShowDeleteConfirm(false)}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: COLORS.surfaceMuted,
                opacity: deleting ? 0.6 : 1,
              }}
            >
              <AppText variant="body" weight="medium">
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              disabled={deleting}
              onPress={confirmDelete}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: 'rgba(248, 113, 113, 0.16)',
                borderWidth: 0.5,
                borderColor: 'rgba(248, 113, 113, 0.35)',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              <AppText
                variant="body"
                weight="medium"
                style={{ color: COLORS.danger }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : showCreate ? (
        <View style={{ padding: 20, gap: 12 }}>
          <TextInput
            placeholder="Playlist name"
            placeholderTextColor={COLORS.textMuted}
            value={newName}
            onChangeText={setNewName}
            autoFocus
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
            onPress={handleCreatePlaylist}
            style={{
              backgroundColor: COLORS.accent,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <AppText variant="body" weight="medium" style={{ color: '#fff' }}>
              Create & Add
            </AppText>
          </Pressable>
        </View>
      ) : showPlaylists ? (
        <View style={{ paddingHorizontal: 20, gap: 4 }}>
          <Pressable
            onPress={() => setShowCreate(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.divider,
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
          {playlists.map((pl) => (
            <Pressable
              key={pl.id}
              onPress={() => handleAddToPlaylist(pl.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 14,
                borderBottomWidth: 0.5,
                borderBottomColor: COLORS.divider,
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
                  {pl.name}
                </AppText>
                <AppText variant="caption" style={{ color: COLORS.textMuted }}>
                  {pl.track_count} tracks
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => setShowPlaylists(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 16,
              borderBottomWidth: 0.5,
              borderBottomColor: COLORS.divider,
            }}
          >
            <AppIcon name="playlist" size={22} color={COLORS.textPrimary} />
            <AppText variant="body" weight="medium">
              Add to Playlist
            </AppText>
          </Pressable>
          {extraAction ? (
            <Pressable
              onPress={extraAction.onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 16,
                borderBottomWidth: 0.5,
                borderBottomColor: COLORS.divider,
              }}
            >
              <AppIcon
                name={extraAction.icon}
                size={22}
                color={extraAction.color ?? COLORS.textPrimary}
              />
              <AppText
                variant="body"
                weight="medium"
                style={{ color: extraAction.color ?? COLORS.textPrimary }}
              >
                {extraAction.label}
              </AppText>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleDelete}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 16,
            }}
          >
            <AppIcon name="trash" size={22} color={COLORS.danger} />
            <AppText
              variant="body"
              weight="medium"
              style={{ color: COLORS.danger }}
            >
              Delete from Downloads
            </AppText>
          </Pressable>
        </View>
      )}
    </AnimatedModal>
  );
}
