import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, TextInput, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
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
  icon: string;
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
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (visible) {
      getPlaylists().then(setPlaylists);
    } else {
      setShowPlaylists(false);
      setShowCreate(false);
      setNewName('');
    }
  }, [visible]);

  const handleDelete = useCallback(() => {
    if (!track) return;
    Alert.alert('Delete Track', `Remove "${track.title}" from downloads?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTrack(track.id);
          onDeleted?.();
          onClose();
        },
      },
    ]);
  }, [track, onClose, onDeleted]);

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

  if (!track) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onClose}
      >
        <View style={{ flex: 1 }} />
        <Pressable
          style={{
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
              {track.title}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: COLORS.textMuted }}
              numberOfLines={1}
            >
              {track.artist.name}
            </AppText>
          </View>

          {showCreate ? (
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
                <AppText
                  variant="body"
                  weight="medium"
                  style={{ color: '#fff' }}
                >
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
                  <AppText
                    variant="body"
                    weight="bold"
                    style={{ color: '#fff' }}
                  >
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
                    <AppIcon
                      name="playlist"
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" weight="medium" numberOfLines={1}>
                      {pl.name}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={{ color: COLORS.textMuted }}
                    >
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
                    name={extraAction.icon as any}
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
                <AppIcon name="close" size={22} color="#EF4444" />
                <AppText
                  variant="body"
                  weight="medium"
                  style={{ color: '#EF4444' }}
                >
                  Delete from Downloads
                </AppText>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
