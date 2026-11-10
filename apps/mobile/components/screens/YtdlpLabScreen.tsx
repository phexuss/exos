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
  measureYtdlpStartup,
  onYtdlpProgress,
  resolveYtdlp,
  updateYtdlp,
  type YtdlpInfo,
} from '@/modules/exos-ytdlp';
import { usePlayerStore } from '@/store/usePlayerStore';
import type { Track } from '@/types/domain';

type Preset = { label: string; args: string[] };

type Case = {
  key: string;
  label: string;
  source: SourceKey;
  defaultUrl: string;
  presets: Preset[];
};

const DEFAULT_PRESET: Preset = { label: 'default', args: [] };

function ytClient(client: string, extra = ''): Preset {
  return {
    label: extra ? `${client} + skip` : client,
    args: ['--extractor-args', `youtube:player_client=${client}${extra}`],
  };
}

// Clients differ in how many API calls they make and whether their formats
// need the JS challenge (QuickJS) at all. The lab times each one.
const YT_PRESETS: Preset[] = [
  DEFAULT_PRESET,
  ytClient('android_vr'),
  ytClient('android_vr', ';player_skip=webpage,configs,js'),
  ytClient('tv_simply'),
  ytClient('tv'),
  ytClient('web_safari'),
  ytClient('ios'),
];

const CASES: Case[] = [
  {
    key: 'yt',
    label: 'YouTube',
    source: 'youtube',
    defaultUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    presets: YT_PRESETS,
  },
  {
    key: 'sc',
    label: 'SoundCloud',
    source: 'soundcloud',
    defaultUrl: 'https://soundcloud.com/forss/flickermood',
    presets: [DEFAULT_PRESET],
  },
];

type EngineState =
  | { kind: 'starting' }
  | { kind: 'ready'; version: string; seconds: string }
  | { kind: 'error'; message: string };

type CaseState =
  | { kind: 'idle' }
  | { kind: 'busy'; jobId: string; percent: number | null }
  | { kind: 'resolved'; info: YtdlpInfo; seconds: string; log: string }
  | { kind: 'downloaded'; info: YtdlpInfo; seconds: string; log: string }
  | { kind: 'error'; message: string };

type Run = { key: number; text: string; ok: boolean };

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

function Chip({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? COLORS.accent : COLORS.border,
        backgroundColor: active ? COLORS.accentSubtle : 'transparent',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <AppText
        variant="caption"
        style={{ color: active ? COLORS.accent : COLORS.textSecondary }}
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
  const [preset, setPreset] = useState<Preset>(item.presets[0]);
  const [verbose, setVerbose] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
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
      const args = verbose ? [...preset.args, '-v'] : preset.args;
      const started = Date.now();
      const record = (ok: boolean, detail: string) =>
        setRuns((prev) =>
          [
            {
              key: started,
              ok,
              text: `${mode === 'download' ? '⬇' : '🔗'} ${preset.label} · ${seconds(Date.now() - started)} s${detail}`,
            },
            ...prev,
          ].slice(0, 10),
        );
      try {
        const run =
          mode === 'download'
            ? await downloadYtdlp(jobId, url.trim(), args)
            : await resolveYtdlp(jobId, url.trim(), args);
        const base = {
          info: run.info,
          seconds: seconds(run.elapsedMs),
          log: verbose ? run.log : '',
        };
        setState(
          mode === 'download'
            ? { kind: 'downloaded', ...base }
            : { kind: 'resolved', ...base },
        );
        record(true, ` · ${codecOf(run.info)}`);
      } catch (error) {
        setState({ kind: 'error', message: errorText(error) });
        record(false, '');
      } finally {
        if (jobRef.current === jobId) jobRef.current = null;
      }
    },
    [item.key, url, preset, verbose],
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs }}>
        {item.presets.length > 1
          ? item.presets.map((p) => (
              <Chip
                key={p.label}
                label={p.label}
                active={p === preset}
                disabled={busy}
                onPress={() => setPreset(p)}
              />
            ))
          : null}
        <Chip
          label="-v"
          active={verbose}
          disabled={busy}
          onPress={() => setVerbose((v) => !v)}
        />
      </View>
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

      {(state.kind === 'downloaded' || state.kind === 'resolved') &&
      state.log ? (
        <AppText
          selectable
          variant="caption"
          style={{ color: COLORS.textMuted, fontFamily: 'monospace' }}
        >
          {state.log}
        </AppText>
      ) : null}

      {runs.length > 0 ? (
        <View style={{ gap: 2 }}>
          {runs.map((run) => (
            <AppText
              key={run.key}
              selectable
              variant="caption"
              style={{
                color: run.ok ? COLORS.textSecondary : COLORS.danger,
                fontFamily: 'monospace',
              }}
            >
              {run.text}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Prototype: proves yt-dlp runs on the phone itself (Python + QuickJS +
 * ffmpeg bundled in the APK), with no EXØS server in the path.
 */
type Props = {
  onClose: () => void;
};

export function YtdlpLabScreen({ onClose }: Props) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [engine, setEngine] = useState<EngineState>({ kind: 'starting' });
  const [updateNote, setUpdateNote] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [startup, setStartup] = useState<string | null>(null);

  const measureStartup = async () => {
    setStartup('…');
    try {
      const ms = await measureYtdlpStartup();
      setStartup(t('ytdlpLab.startupResult', { seconds: seconds(ms) }));
    } catch (error) {
      setStartup(errorText(error));
    }
  };

  useEffect(() => {
    if (!isYtdlpAvailable) return;
    let alive = true;
    initYtdlp()
      .then(({ version, elapsedMs }) => {
        if (!alive) return;
        setEngine({
          kind: 'ready',
          version: version ?? 'built-in',
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
      // The overlay behind draws the page colour, or the glow in Glass mode.
      style={{ flex: 1 }}
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
        onLeadingPress={onClose}
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
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: SPACING.sm,
              }}
            >
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
              <Button
                label={t('ytdlpLab.startupMeasure')}
                disabled={!engineReady || updating}
                onPress={() => void measureStartup()}
              />
            </View>
            {startup ? (
              <AppText variant="caption" style={{ color: COLORS.textMuted }}>
                {startup}
              </AppText>
            ) : null}
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
