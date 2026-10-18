import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';

import { AnimatedModal } from '@/components/AnimatedModal';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SOURCES } from '@/constants/sources';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import {
  disconnectSpotify,
  getSpotifyConnectUrl,
  getSpotifyPlaylists,
  getSpotifyStatus,
  isSpotifyNotConnected,
  SPOTIFY_LIKED_ID,
  type SpotifyPlaylist,
  type SpotifyStatus,
} from '@/services/api/spotify';
import {
  cancelSpotifyImport,
  runSpotifyImport,
  type SpotifyImportJob,
  useSpotifyImportStore,
} from '@/services/import/spotifyImport';

/** Must match SPOTIFY_APP_REDIRECT_URI on the API. */
const SPOTIFY_RETURN_URL = 'exos://spotify-auth';

type SpotifyImportModalProps = {
  visible: boolean;
  onClose: () => void;
};

function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

function ActionButton({
  label,
  onPress,
  disabled,
  tone = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'primary' | 'spotify' | 'ghost';
}) {
  const background =
    tone === 'spotify'
      ? SOURCES.spotify.color
      : tone === 'ghost'
        ? 'transparent'
        : COLORS.textPrimary;
  const color = tone === 'ghost' ? COLORS.textSecondary : COLORS.background;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: background,
        borderWidth: tone === 'ghost' ? 0.5 : 0,
        borderColor: COLORS.border,
        opacity: disabled ? 0.4 : 1,
        alignItems: 'center',
      }}
    >
      <AppText variant="body" weight="medium" style={{ color, fontSize: 13 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function JobCard({ job }: { job: SpotifyImportJob }) {
  const { t } = useI18n();
  const running = job.status === 'running';
  const matched = Math.max(0, job.total - job.unmatched);
  const progress = matched > 0 ? Math.min(1, job.processed / matched) : 0;

  const headline = running
    ? t('spotify.importing')
    : job.status === 'done'
      ? t('spotify.importDone')
      : job.status === 'cancelled'
        ? t('spotify.importCancelled')
        : isForbidden(job.error)
          ? t('spotify.forbidden')
          : t('spotify.importError');

  return (
    <View
      style={{
        backgroundColor: COLORS.background,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        padding: SPACING.md,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {running ? <ActivityIndicator color={SOURCES.spotify.color} /> : null}
        <AppText variant="label" weight="bold" style={{ flex: 1 }}>
          {headline}
        </AppText>
        {running ? (
          <ActionButton
            label={t('common.cancel')}
            tone="ghost"
            onPress={cancelSpotifyImport}
          />
        ) : null}
      </View>
      <AppText
        variant="caption"
        numberOfLines={1}
        style={{ color: COLORS.textSecondary }}
      >
        {job.playlistName}
      </AppText>
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: COLORS.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.round(progress * 100)}%`,
            height: 4,
            backgroundColor: SOURCES.spotify.color,
          }}
        />
      </View>
      <AppText variant="caption" style={{ color: COLORS.textMuted }}>
        {t('spotify.importStats', {
          downloaded: job.downloaded,
          skipped: job.skipped,
          failed: job.failed,
          unmatched: job.unmatched,
        })}
      </AppText>
    </View>
  );
}

export function SpotifyImportModal({
  visible,
  onClose,
}: SpotifyImportModalProps) {
  const { t, tn } = useI18n();
  const { height } = useWindowDimensions();
  const job = useSpotifyImportStore((s) => s.job);
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const describeError = useCallback(
    (e: unknown) =>
      isForbidden(e) ? t('spotify.forbidden') : t('spotify.loadError'),
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextStatus = await getSpotifyStatus();
      setStatus(nextStatus);
      if (nextStatus.connected) {
        setPlaylists(await getSpotifyPlaylists());
      } else {
        setPlaylists([]);
      }
    } catch (e) {
      if (__DEV__) console.warn('[SpotifyImport] Load failed:', e);
      if (isSpotifyNotConnected(e)) {
        setStatus((s) => (s ? { ...s, connected: false } : s));
        setPlaylists([]);
      } else {
        setError(describeError(e));
      }
    } finally {
      setLoading(false);
    }
  }, [describeError]);

  useEffect(() => {
    if (visible) {
      load();
    } else {
      setError(null);
    }
  }, [visible, load]);

  const connect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const url = await getSpotifyConnectUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        SPOTIFY_RETURN_URL,
      );
      if (result.type === 'success') {
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.status !== 'ok') {
          setError(
            queryParams?.reason === 'forbidden'
              ? t('spotify.forbidden')
              : t('spotify.connectError'),
          );
        }
      }
    } catch (e) {
      if (__DEV__) console.warn('[SpotifyImport] Connect failed:', e);
      setError(t('spotify.connectError'));
    } finally {
      setBusy(false);
    }
    await load();
  }, [load, t]);

  const disconnect = useCallback(async () => {
    setBusy(true);
    try {
      await disconnectSpotify();
    } catch (e) {
      if (__DEV__) console.warn('[SpotifyImport] Disconnect failed:', e);
    } finally {
      setBusy(false);
    }
    await load();
  }, [load]);

  const startImport = useCallback(
    (playlist: SpotifyPlaylist) => {
      const name =
        playlist.id === SPOTIFY_LIKED_ID
          ? t('spotify.likedPlaylistName')
          : playlist.name;
      void runSpotifyImport(playlist.id, name);
    },
    [t],
  );

  const running = job?.status === 'running';
  const listHeight = Math.min(height * 0.5, 480);

  const renderBody = () => {
    if (loading && !status) {
      return (
        <View style={{ paddingVertical: 36, alignItems: 'center', gap: 10 }}>
          <ActivityIndicator color={COLORS.accent} />
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            {t('common.loading')}
          </AppText>
        </View>
      );
    }

    if (!status) {
      return (
        <View style={{ paddingVertical: 28, alignItems: 'center', gap: 12 }}>
          <AppText
            variant="body"
            style={{ color: COLORS.textSecondary, textAlign: 'center' }}
          >
            {error ?? t('spotify.loadError')}
          </AppText>
          <ActionButton label={t('common.retry')} onPress={load} />
        </View>
      );
    }

    if (!status.configured) {
      return (
        <AppText
          variant="body"
          style={{
            color: COLORS.textSecondary,
            textAlign: 'center',
            paddingVertical: 28,
          }}
        >
          {t('spotify.notConfigured')}
        </AppText>
      );
    }

    if (!status.connected) {
      return (
        <View style={{ paddingVertical: 20, gap: 14 }}>
          <AppText variant="body" style={{ color: COLORS.textSecondary }}>
            {t('spotify.connectHint')}
          </AppText>
          <ActionButton
            label={busy ? t('common.loading') : t('spotify.connect')}
            tone="spotify"
            disabled={busy}
            onPress={connect}
          />
        </View>
      );
    }

    return (
      <ScrollView
        style={{ height: listHeight }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 2 }}
      >
        {playlists.map((playlist) => (
          <View
            key={playlist.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 8,
              opacity: playlist.readable ? 1 : 0.5,
            }}
          >
            {playlist.coverUrl ? (
              <Image
                source={{ uri: playlist.coverUrl }}
                style={{ width: 44, height: 44, borderRadius: 6 }}
              />
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  backgroundColor: COLORS.background,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon
                  name={playlist.id === SPOTIFY_LIKED_ID ? 'heart' : 'playlist'}
                  size={20}
                  color={SOURCES.spotify.color}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppText variant="label" weight="medium" numberOfLines={1}>
                {playlist.id === SPOTIFY_LIKED_ID
                  ? t('spotify.liked')
                  : playlist.name}
              </AppText>
              <AppText
                variant="caption"
                numberOfLines={2}
                style={{ color: COLORS.textMuted, marginTop: 2 }}
              >
                {playlist.readable
                  ? tn('tracks', playlist.total)
                  : t('spotify.notReadable')}
              </AppText>
            </View>
            <ActionButton
              label={t('spotify.import')}
              disabled={running || !playlist.readable || playlist.total === 0}
              onPress={() => startImport(playlist)}
            />
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={onClose}
      onBackdropPress={onClose}
      backdropStyle={{ paddingHorizontal: 16 }}
      contentStyle={{
        width: '100%',
        maxHeight: '86%',
        backgroundColor: COLORS.surface,
        borderRadius: 18,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        padding: SPACING.lg,
        gap: SPACING.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="title" weight="bold">
            {t('spotify.title')}
          </AppText>
          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, marginTop: 2 }}
          >
            {status?.connected && status.displayName
              ? t('spotify.connectedAs', { name: status.displayName })
              : t('spotify.subtitle')}
          </AppText>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="close" size={20} color={COLORS.textMuted} />
        </Pressable>
      </View>

      {job ? <JobCard job={job} /> : null}

      {error && status ? (
        <AppText variant="caption" style={{ color: COLORS.danger }}>
          {error}
        </AppText>
      ) : null}

      {renderBody()}

      {status?.connected ? (
        <View style={{ alignItems: 'flex-start' }}>
          <ActionButton
            label={t('spotify.disconnect')}
            tone="ghost"
            disabled={busy || running}
            onPress={disconnect}
          />
        </View>
      ) : null}
    </AnimatedModal>
  );
}
