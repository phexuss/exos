import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants/colors';
import type { SourceKey } from '@/constants/sources';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';
import {
  cancelYtdlp,
  downloadYtdlp,
  initYtdlp,
  isYtdlpAvailable,
  onYtdlpProgress,
  resolveYtdlp,
  updateYtdlp,
  type YtdlpInfo,
} from '@/modules/exos-ytdlp';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type Case = {
  key: string;
  label: string;
  source: SourceKey;
  defaultUrl: string;
};

const CASES: Case[] = [
  {
    key: 'yt',
    label: 'YouTube',
    source: 'youtube',
    defaultUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    key: 'sc',
    label: 'SoundCloud',
    source: 'soundcloud',
    defaultUrl: 'https://soundcloud.com/forss/flickermood',
  },
];

type EngineState =
  | { kind: 'starting' }
  | { kind: 'ready'; version: string; seconds: string }
  | { kind: 'error'; message: string };

type CaseState =
  | { kind: 'idle' }
  | { kind: 'busy'; jobId: string; percent: number | null }
  | { kind: 'resolved'; info: YtdlpInfo; seconds: string }
  | { kind: 'downloaded'; info: YtdlpInfo; seconds: string }
  | { kind: 'error'; message: string };

function seconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

function formatSize(bytes: number | undefined): string {
  if (!bytes) return '?';
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function codecOf(info: YtdlpInfo): string {
  const fmt = info.requested_formats?.[0] ?? info;
  const parts = [
    fmt.acodec ?? info.ext,
    fmt.abr ? `${Math.round(fmt.abr)}k` : null,
  ];
  return parts.filter(Boolean).join(' ');
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function toTrack(info: YtdlpInfo, source: SourceKey): Track {
  const durationSec = info.duration ?? 0;
  return {
    id: `ytdlp-lab:${info.extractor_key ?? source}:${info.id}`,
    title: info.track ?? info.title ?? info.id,
    artist: { id: 'ytdlp-lab', name: info.artist ?? info.uploader ?? '' },
    duration: formatDuration(durationSec),
    durationSec,
    coverUrl: info.thumbnail,
    source,
    filePath: info.filepath ? `file://${info.filepath}` : undefined,
    isDownloaded: true,
  };
}

function Button({
  label,
  onPress,
  disabled,
  primary,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: primary ? COLORS.accent : COLORS.surfaceElevated,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <AppText
        variant="label"
        weight="medium"
        style={{ color: primary ? COLORS.background : COLORS.textPrimary }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function ErrorBox({ message, hint }: { message: string; hint: string }) {
  return (
    <View style={{ gap: SPACING.xs }}>
      <AppText
        selectable
        variant="caption"
        style={{ color: COLORS.danger, fontFamily: 'monospace' }}
      >
        {message}
      </AppText>
      <AppText variant="caption" style={{ color: COLORS.textMuted }}>
        {hint}
      </AppText>
    </View>
  );
}

function CaseCard({ item, engineReady }: { item: Case; engineReady: boolean }) {
  const { t } = useI18n();
  const [url, setUrl] = useState(item.defaultUrl);
  const [state, setState] = useState<CaseState>({ kind: 'idle' });
  const [lastLine, setLastLine] = useState('');
  const jobRef = useRef<string | null>(null);

  useEffect(() => {
    const sub = onYtdlpProgress((event) => {
      if (event.id !== jobRef.current) return;
      if (event.line) setLastLine(event.line);
      setState((prev) =>
        prev.kind === 'busy'
          ? { ...prev, percent: event.progress >= 0 ? event.progress : null }
          : prev,
      );
    });
    return () => sub?.remove();
  }, []);

  const run = useCallback(
    async (mode: 'download' | 'resolve') => {
      const jobId = `${item.key}-${Date.now()}`;
      jobRef.current = jobId;
      setLastLine('');
      setState({ kind: 'busy', jobId, percent: null });
      try {
        if (mode === 'download') {
          const { info, elapsedMs } = await downloadYtdlp(jobId, url.trim());
          setState({ kind: 'downloaded', info, seconds: seconds(elapsedMs) });
        } else {
          const { info, elapsedMs } = await resolveYtdlp(jobId, url.trim());
          setState({ kind: 'resolved', info, seconds: seconds(elapsedMs) });
        }
      } catch (error) {
        setState({ kind: 'error', message: errorText(error) });
      } finally {
        if (jobRef.current === jobId) jobRef.current = null;
      }
    },
    [item.key, url],
  );

  const busy = state.kind === 'busy';

  return (
    <View
      style={{
        gap: SPACING.md,
        padding: SPACING.lg,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
      }}
    >
      <AppText variant="title" weight="bold">
        {item.label}
      </AppText>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder={t('ytdlpLab.urlPlaceholder')}
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
        style={{
          color: COLORS.textPrimary,
          fontFamily: 'Jost-Regular',
          fontSize: 14,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: COLORS.surfaceMuted,
        }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {busy ? (
          <Button
            label={t('ytdlpLab.cancel')}
            onPress={() => cancelYtdlp(state.jobId)}
          />
        ) : (
          <>
            <Button
              primary
              label={t('ytdlpLab.download')}
              disabled={!engineReady || !url.trim()}
              onPress={() => void run('download')}
            />
            <Button
              label={t('ytdlpLab.resolve')}
              disabled={!engineReady || !url.trim()}
              onPress={() => void run('resolve')}
            />
          </>
        )}
        {state.kind === 'downloaded' && state.info.filepath ? (
          <Button
            label={t('ytdlpLab.play')}
            onPress={() =>
              usePlayerStore.getState().play(toTrack(state.info, item.source))
            }
          />
        ) : null}
      </View>

      {busy ? (
        <View style={{ gap: SPACING.xs }}>
          <AppText variant="label" style={{ color: COLORS.textSecondary }}>
            {state.percent == null
              ? t('ytdlpLab.preparing')
              : t('ytdlpLab.downloading', {
                  percent: state.percent.toFixed(0),
                })}
          </AppText>
          {lastLine ? (
            <AppText
              variant="caption"
              numberOfLines={2}
              style={{ color: COLORS.textMuted, fontFamily: 'monospace' }}
            >
              {lastLine}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {state.kind === 'downloaded' || state.kind === 'resolved' ? (
        <View style={{ gap: SPACING.xs }}>
          <AppText variant="label" weight="medium" numberOfLines={2}>
            {[
              state.info.artist ?? state.info.uploader,
              state.info.track ?? state.info.title,
            ]
              .filter(Boolean)
              .join(' — ')}
          </AppText>
          <AppText variant="caption" style={{ color: COLORS.textSecondary }}>
            {state.kind === 'downloaded'
              ? t('ytdlpLab.downloaded', {
                  seconds: state.seconds,
                  size: formatSize(
                    state.info.filesize ?? state.info.filesize_approx,
                  ),
                  codec: codecOf(state.info),
                })
              : t('ytdlpLab.resolved', {
                  seconds: state.seconds,
                  protocol: state.info.protocol ?? '?',
                  codec: codecOf(state.info),
                })}
          </AppText>
        </View>
      ) : null}

      {state.kind === 'error' ? (
        <ErrorBox message={state.message} hint={t('ytdlpLab.copy')} />
      ) : null}
    </View>
  );
}

/**
 * Prototype: proves yt-dlp runs on the phone itself (Python + QuickJS +
 * ffmpeg bundled in the APK), with no EXØS server in the path.
 */
export default function YtdlpLabScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [engine, setEngine] = useState<EngineState>({ kind: 'starting' });
  const [updateNote, setUpdateNote] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isYtdlpAvailable) return;
    let alive = true;
    initYtdlp()
      .then(({ version, elapsedMs }) => {
        if (!alive) return;
        setEngine({
          kind: 'ready',
          version: version ?? '?',
          seconds: seconds(elapsedMs),
        });
      })
      .catch((error: unknown) => {
        if (alive) setEngine({ kind: 'error', message: errorText(error) });
      });
    return () => {
      alive = false;
    };
  }, []);

  const update = async (channel: 'stable' | 'nightly') => {
    setUpdating(true);
    setUpdateNote(null);
    try {
      const { status, version } = await updateYtdlp(channel);
      const label = version ?? '?';
      setUpdateNote(
        status === 'DONE'
          ? t('ytdlpLab.updated', { version: label })
          : t('ytdlpLab.upToDate', { version: label }),
      );
      setEngine((prev) =>
        prev.kind === 'ready' ? { ...prev, version: label } : prev,
      );
    } catch (error) {
      setUpdateNote(errorText(error));
    } finally {
      setUpdating(false);
    }
  };

  const engineReady = engine.kind === 'ready';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{
        paddingTop: insets.top + SPACING.md,
        paddingBottom: insets.bottom + 120,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.xl,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title={t('ytdlpLab.title')}
        leading="back"
        withTopInset={false}
        onLeadingPress={() =>
          router.canGoBack()
            ? router.back()
            : router.replace('/(tabs)' as never)
        }
      />
      <AppText variant="body" style={{ color: COLORS.textSecondary }}>
        {t('ytdlpLab.intro')}
      </AppText>

      {!isYtdlpAvailable ? (
        <AppText variant="body" style={{ color: COLORS.warning }}>
          {t('ytdlpLab.unavailable')}
        </AppText>
      ) : (
        <>
          <View
            style={{
              gap: SPACING.md,
              padding: SPACING.lg,
              borderRadius: 20,
              backgroundColor: COLORS.surface,
            }}
          >
            <AppText variant="title" weight="bold">
              {t('ytdlpLab.engine')}
            </AppText>
            {engine.kind === 'starting' ? (
              <AppText variant="label" style={{ color: COLORS.textSecondary }}>
                {t('ytdlpLab.starting')}
              </AppText>
            ) : engine.kind === 'ready' ? (
              <AppText variant="label" style={{ color: COLORS.textSecondary }}>
                {t('ytdlpLab.ready', {
                  version: engine.version,
                  seconds: engine.seconds,
                })}
              </AppText>
            ) : (
              <ErrorBox message={engine.message} hint={t('ytdlpLab.copy')} />
            )}
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              <Button
                primary
                label={updating ? t('ytdlpLab.updating') : t('ytdlpLab.update')}
                disabled={!engineReady || updating}
                onPress={() => void update('stable')}
              />
              <Button
                label={t('ytdlpLab.updateNightly')}
                disabled={!engineReady || updating}
                onPress={() => void update('nightly')}
              />
            </View>
            {updateNote ? (
              <AppText
                selectable
                variant="caption"
                style={{ color: COLORS.textMuted }}
              >
                {updateNote}
              </AppText>
            ) : null}
          </View>

          {CASES.map((item) => (
            <CaseCard key={item.key} item={item} engineReady={engineReady} />
          ))}
        </>
      )}
    </ScrollView>
  );
}
