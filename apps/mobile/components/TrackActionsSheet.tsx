import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AuthTextField } from '@/components/auth/AuthTextField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { PillButton } from '@/components/ui/PillButton';
import { SheetItem } from '@/components/ui/SheetItem';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import {
  addTrackToPlaylist,
  createPlaylist,
  getPlaylists,
  type PlaylistRow,
} from '@/services/db/database';
import { deleteTrack } from '@/services/download/downloadService';
import type { Track } from '@/types/domain';

/** Cover in the sheet's head. */
const COVER = 48;

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
  const { t, tn } = useI18n();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newName, setNewName] = useState('');
  const [presentedTrack, setPresentedTrack] = useState<Track | null>(track);

  useEffect(() => {
    if (visible) {
      getPlaylists()
        .then(setPlaylists)
        .catch((error) => console.warn('[TrackActions] Playlists:', error));
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

  // A double tap used to create the playlist (or add the track) twice.
  const busy = useRef(false);

  const runOnce = useCallback(
    async (work: () => Promise<void>) => {
      if (busy.current) return;
      busy.current = true;
      try {
        await work();
        onClose();
      } catch (error) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        console.warn('[TrackActions] Playlist change failed:', error);
      } finally {
        busy.current = false;
      }
    },
    [onClose],
  );

  const handleAddToPlaylist = useCallback(
    (playlistId: string) => {
      if (!track) return;
      void runOnce(() => addTrackToPlaylist(playlistId, track.id));
    },
    [track, runOnce],
  );

  const handleCreatePlaylist = useCallback(() => {
    const name = newName.trim();
    if (!name || !track) return;
    void runOnce(async () => {
      const id = await createPlaylist(name);
      await addTrackToPlaylist(id, track.id);
    });
  }, [newName, track, runOnce]);

  const activeTrack = track ?? presentedTrack;

  if (!activeTrack) return null;

  return (
    <AnimatedModal
      visible={visible}
      variant="sheet"
      onRequestClose={onClose}
      onBackdropPress={onClose}
      contentStyle={{
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: GLASS.radius.sheet,
        borderTopRightRadius: GLASS.radius.sheet,
        paddingHorizontal: SPACING.sm,
        paddingBottom: SPACING.lg,
      }}
    >
      <View style={{ alignItems: 'center', paddingVertical: SPACING.md }}>
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: GLASS.rimStrong,
          }}
        />
      </View>

      {/* What the sheet acts on, like the head of the desktop menu. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingHorizontal: 10,
          paddingBottom: SPACING.md,
        }}
      >
        <View
          style={{
            width: COVER,
            height: COVER,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: COLORS.fill2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {activeTrack.coverUrl ? (
            <Image
              source={{ uri: activeTrack.coverUrl }}
              style={{ width: COVER, height: COVER }}
              contentFit="cover"
            />
          ) : (
            <AppIcon name="music" size={22} color={COLORS.textMuted} />
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {activeTrack.title}
          </AppText>
          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, fontSize: 13 }}
            numberOfLines={1}
          >
            {activeTrack.artist.name}
          </AppText>
        </View>
      </View>
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: COLORS.divider,
          marginHorizontal: 10,
          marginBottom: SPACING.sm,
        }}
      />

      {showDeleteConfirm ? (
        <View style={{ padding: 10, gap: SPACING.xl }}>
          <View style={{ gap: 8 }}>
            <AppText variant="title" weight="bold">
              {t('trackActions.deleteDownloadTitle')}
            </AppText>
            <AppText
              variant="body"
              style={{ color: COLORS.textSecondary, lineHeight: 22 }}
            >
              {t('trackActions.deleteDownloadMessage', {
                title: activeTrack.title,
              })}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PillButton
              label={t('common.cancel')}
              tone="quiet"
              disabled={deleting}
              onPress={() => setShowDeleteConfirm(false)}
            />
            <PillButton
              label={deleting ? t('common.deleting') : t('common.delete')}
              tone="danger"
              disabled={deleting}
              onPress={confirmDelete}
            />
          </View>
        </View>
      ) : showCreate ? (
        <View style={{ padding: 10, gap: SPACING.md }}>
          <AuthTextField
            icon="playlist"
            placeholder={t('library.playlistName')}
            value={newName}
            onChangeText={setNewName}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={handleCreatePlaylist}
            autoFocus
          />
          <PrimaryButton
            label={t('library.createAndAdd')}
            onPress={handleCreatePlaylist}
            disabled={!newName.trim()}
          />
        </View>
      ) : showPlaylists ? (
        <View style={{ gap: 2 }}>
          <SheetItem
            icon="plus"
            tone="accent"
            label={t('library.newPlaylist')}
            onPress={() => setShowCreate(true)}
          />
          {playlists.map((pl) => (
            <SheetItem
              key={pl.id}
              icon="playlist"
              label={pl.name}
              detail={tn('tracks', pl.track_count)}
              onPress={() => handleAddToPlaylist(pl.id)}
            />
          ))}
        </View>
      ) : (
        <View style={{ gap: 2 }}>
          <SheetItem
            icon="playlist"
            label={t('library.addToPlaylist')}
            next
            onPress={() => setShowPlaylists(true)}
          />
          {extraAction ? (
            <SheetItem
              icon={extraAction.icon}
              label={extraAction.label}
              color={extraAction.color}
              onPress={extraAction.onPress}
            />
          ) : null}
          <SheetItem
            icon="trash"
            tone="danger"
            label={t('trackActions.deleteFromDownloads')}
            onPress={handleDelete}
          />
        </View>
      )}
    </AnimatedModal>
  );
}
