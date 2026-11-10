import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedModal } from '@/components/AnimatedModal';
import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppDialog } from '@/components/AppDialog';
import { Rise } from '@/components/motion/Rise';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { TrackItem } from '@/components/TrackItem';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { LoadFailed } from '@/components/ui/LoadFailed';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { COLORS } from '@/constants/colors';
import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { FONT_FAMILY } from '@/constants/typography';
import { useDynamicAccent } from '@/hooks/useDynamicAccent';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
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
  const { t, tn } = useI18n();
  const glassMode = useGlassMode();
  // Glass mode: the overlay draws the ambient glow behind this screen.
  const background = glassMode ? 'transparent' : COLORS.background;
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

  const [loadState, setLoadState] = useState<
    'loading' | 'ready' | 'missing' | 'failed'
  >('loading');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const pls = await getPlaylists();
      const found = pls.find((p) => p.id === id) ?? null;
      setPlaylist(found);
      if (!found) {
        setLoadState('missing');
        return;
      }
      setTracks(await getPlaylistTracks(id));
      setLoadState('ready');
    } catch (error) {
      console.warn('[Playlist] Load failed:', error);
      setLoadState('failed');
    }
  }, [id]);

  useEffect(() => {
    void load();
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
    ({ item, index }) => (
      <Rise index={index} after={2} animate={index <= MOTION.staggerCap}>
        <TrackItem
          track={item}
          onPress={handlePlay}
          onLongPress={handleLongPress}
          isActive={currentTrackId === item.id}
          accentColor={accentColor}
        />
      </Rise>
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
      setRemoveError(t('playlist.removeError'));
    } finally {
      setRemovingTrack(false);
    }
  }, [selectedTrack, id, removingTrack, load, t]);

  const openEditModal = useCallback(() => {
    if (!playlist) return;
    setEditName(playlist.name);
    setEditCover(playlist.cover_url);
    setShowEdit(true);
  }, [playlist]);

  const handleSaveEdit = useCallback(async () => {
    if (!id || !playlist || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const trimmed = editName.trim();
      if (trimmed && trimmed !== playlist.name) {
        await renamePlaylist(id, trimmed);
      }
      if (editCover !== playlist.cover_url) {
        await updatePlaylistCover(id, editCover);
      }
      setShowEdit(false);
      void load();
    } catch (error) {
      console.warn('[Playlist] Save failed:', error);
      setSaveError(t('common.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [id, playlist, editName, editCover, load, saving, t]);

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
      setDeleteError(t('playlist.deleteError'));
    } finally {
      setDeletingPlaylist(false);
    }
  }, [id, playlist, deletingPlaylist, closePlaylist, t]);

  const pickCoverFromGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setEditCover(result.assets[0].uri);
      }
    } catch (error) {
      // Gallery permission denied or picker unavailable.
      console.warn('[Playlist] Cover pick failed:', error);
    }
  }, []);

  if (loadState === 'missing' || loadState === 'failed') {
    return (
      <LoadFailed
        message={t('playlist.notFound')}
        onRetry={loadState === 'failed' ? () => void load() : undefined}
        onClose={closePlaylist}
        background={background}
      />
    );
  }

  if (!playlist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
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
      style={{ flex: 1, backgroundColor: background }}
      edges={['top']}
    >
      <ScreenHeader
        title={playlist.name}
        leading="back"
        onLeadingPress={closePlaylist}
        trailing={{
          icon: 'settings',
          onPress: openEditModal,
          accessibilityLabel: t('library.editPlaylist'),
        }}
        gutter={LAYOUT.gutter}
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <AppText variant="caption" style={{ color: COLORS.textMuted }}>
          {tn('tracks', tracks.length)}
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
              {t('playlist.empty')}
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
          label: t('playlist.removeTrack'),
          icon: 'close',
          color: '#EF4444',
          onPress: handleRemoveFromPlaylist,
        }}
      />

      <AppDialog
        visible={showRemoveConfirm}
        title={t('playlist.removeTitle')}
        message={
          selectedTrack
            ? t('playlist.removeMessage', { title: selectedTrack.title })
            : null
        }
        error={removeError}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.remove')}
        busyLabel={t('common.removing')}
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
          {t('library.editPlaylist')}
        </AppText>

        <AnimatedPressable
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
              transition={MOTION.dur.quick}
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
                {t('playlist.addCover')}
              </AppText>
            </View>
          )}
        </AnimatedPressable>

        <TextInput
          maxFontSizeMultiplier={LAYOUT.maxFontScale}
          value={editName}
          onChangeText={setEditName}
          placeholder={t('library.playlistName')}
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

        <AnimatedPressable
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
            {t('playlist.deletePlaylist')}
          </AppText>
        </AnimatedPressable>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <AnimatedPressable
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
              {t('common.cancel')}
            </AppText>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={handleSaveEdit}
            disabled={saving}
            style={{
              opacity: saving ? 0.5 : 1,
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: COLORS.accent,
            }}
          >
            <AppText variant="body" weight="medium" style={{ color: '#fff' }}>
              {t('common.save')}
            </AppText>
          </AnimatedPressable>
        </View>
        {saveError ? (
          <AppText
            variant="caption"
            style={{ color: COLORS.danger, marginTop: 8, textAlign: 'center' }}
          >
            {saveError}
          </AppText>
        ) : null}
      </AnimatedModal>

      <AppDialog
        visible={showDeleteConfirm}
        title={t('playlist.deleteTitle')}
        message={t('playlist.deleteMessage', { name: playlist.name })}
        error={deleteError}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        busyLabel={t('common.deleting')}
        confirmTone="danger"
        busy={deletingPlaylist}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeletePlaylist}
      />
    </SafeAreaView>
  );
}
