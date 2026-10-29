import { CheckCircle2, CircleAlert, Download, FolderOpen, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { type CookieCheck, engine, openFolder, pickFolder, type Tool, type ToolInfo } from '@/lib/engine';
import { useT } from '@/i18n';
import { API_BASE_URL } from '@/lib/env';
import { useAuth } from '@/store/auth';
import { useEngine } from '@/store/engine';
import { type CookiesBrowser, useSettings } from '@/store/settings';
import { Toggle } from '@/components/ui';
import { Select } from '@/components/Select';
import { Tabs } from '@/components/Tabs';

function CookiesCheck({ browser }: { browser: string }) {
  const [state, setState] = useState<{ for: string; busy: boolean; result?: CookieCheck; error?: string }>({
    for: browser,
    busy: false,
  });
  const { t } = useT();
  const current = state.for === browser ? state : { for: browser, busy: false };
  const run = () => {
    setState({ for: browser, busy: true });
    engine
      .checkCookies(browser)
      .then((result) => setState({ for: browser, busy: false, result }))
      .catch((e) => setState({ for: browser, busy: false, error: String(e) }));
  };
  const r = current.result;
  return (
    <div className="row">
      <div style={{ minWidth: 0 }}>
        <div className="row__label">{t('settings.cookiesCheck')}</div>
        <div className="row__hint">
          {current.error ? (
            <span style={{ color: 'var(--danger)' }}>{current.error}</span>
          ) : r ? (
            r.signedIn ? (
              t('settings.cookiesOk', { count: r.count, youtube: r.youtube })
            ) : (
              t('settings.cookiesNoSignIn', {
                count: r.count,
                youtube: r.youtube,
              })
            )
          ) : (
            t('settings.cookiesIdle')
          )}
        </div>
      </div>
      <button type="button" className="btn sm" disabled={current.busy} onClick={run}>
        <RefreshCw size={14} className={current.busy ? 'spin-icon' : undefined} />{' '}
        {current.busy ? t('settings.cookiesChecking') : t('settings.cookiesCheckButton')}
      </button>
    </div>
  );
}

function ToolRow({
  tool,
  name,
  hint,
  info,
  installable,
  missingHint,
}: {
  tool: Tool;
  name: string;
  hint: string;
  info: ToolInfo | null;
  installable: boolean;
  missingHint: string;
}) {
  const installing = useEngine((s) => s.installing);
  const install = useEngine((s) => s.install);
  const updating = useEngine((s) => s.updating);
  const updateYtdlp = useEngine((s) => s.updateYtdlp);
  const busy = installing?.tool === tool;
  const { t } = useT();
  return (
    <div className="row">
      <div style={{ minWidth: 0 }}>
        <div className="row__label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {info ? <CheckCircle2 size={16} color="var(--ok)" /> : <CircleAlert size={16} color="var(--warning)" />}
          {name}
          {info && <span className="muted tabular" style={{ fontWeight: 400 }}>{info.version}</span>}
        </div>
        <div className="row__hint">{info ? hint : missingHint}</div>
        {info && (
          <div className="row__value ellipsis" title={info.path} style={{ marginTop: 4 }}>
            {info.path}
            {` · ${info.managed ? t('settings.managed') : t('settings.system')}`}
          </div>
        )}
      </div>
      <div className="tool-status">
        {busy ? (
          <span className="muted tabular">{Math.round(installing.progress * 100)}%</span>
        ) : info ? (
          tool === 'ytdlp' && (
            <button type="button" className="btn sm" onClick={() => void updateYtdlp()} disabled={updating}>
              <RefreshCw size={14} className={updating ? 'spin-icon' : ''} />{' '}
              {updating ? t('common.updating') : t('common.update')}
            </button>
          )
        ) : installable ? (
          <button type="button" className="btn sm primary" onClick={() => void install(tool)}>
            <Download size={14} /> {t('common.install')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

const BROWSERS: [CookiesBrowser, string][] = [
  ['chrome', 'Chrome'],
  ['firefox', 'Firefox'],
  ['edge', 'Edge'],
  ['brave', 'Brave'],
  ['opera', 'Opera'],
  ['vivaldi', 'Vivaldi'],
  ['safari', 'Safari'],
];

export function Settings() {
  const s = useSettings();
  const status = useEngine((st) => st.status);
  const user = useAuth((st) => st.user);
  const logout = useAuth((st) => st.logout);
  const musicDir = s.musicDir ?? status?.musicDir ?? '';
  const { t } = useT();

  return (
    <div className="page page-enter">
      <h1 className="h1">{t('settings.title')}</h1>
      <div className="settings">
        <section>
          <h2 className="h2 group__title">{t('settings.engine')}</h2>
          <div className="group">
            <ToolRow
              tool="ytdlp"
              name="yt-dlp"
              info={status?.ytdlp ?? null}
              installable={status?.installable.ytdlp ?? false}
              hint={t('settings.ytdlpHint')}
              missingHint={t('settings.ytdlpMissing')}
            />
            <ToolRow
              tool="deno"
              name={t('settings.jsName')}
              info={status?.jsRuntime ?? null}
              installable={status?.installable.deno ?? false}
              hint={t('settings.jsHint', {
                name: status?.jsRuntime?.name ?? 'Deno',
              })}
              missingHint={t('settings.jsMissing')}
            />
            <ToolRow
              tool="ffmpeg"
              name="ffmpeg"
              info={status?.ffmpeg ?? null}
              installable={status?.installable.ffmpeg ?? false}
              hint={t('settings.ffmpegHint')}
              missingHint={t('settings.ffmpegMissing')}
            />
            <div className="row">
              <div>
                <div className="row__label">{t('settings.cookies')}</div>
                <div className="row__hint">{t('settings.cookiesHint')}</div>
              </div>
              <Select
                id="cookies-browser"
                value={s.cookiesBrowser}
                onChange={(cookiesBrowser) => s.set({ cookiesBrowser })}
                label={t('settings.cookies')}
                options={[
                  {
                    value: '' as CookiesBrowser,
                    label: t('settings.cookiesOff'),
                  },
                  ...BROWSERS.map(([value, label]) => ({ value, label })),
                ]}
              />
            </div>
            {s.cookiesBrowser && <CookiesCheck browser={s.cookiesBrowser} />}
          </div>
        </section>

        <section>
          <h2 className="h2 group__title">{t('settings.downloading')}</h2>
          <div className="group">
            <div className="row">
              <div style={{ minWidth: 0 }}>
                <div className="row__label">{t('settings.musicFolder')}</div>
                <div className="row__value ellipsis" style={{ marginTop: 4 }}>
                  {musicDir}
                </div>
              </div>
              <div className="tool-status">
                <button type="button" className="btn sm" onClick={() => void openFolder(musicDir)}>
                  <FolderOpen size={14} /> {t('common.open')}
                </button>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() =>
                    void pickFolder().then((dir) => {
                      if (dir) s.set({ musicDir: dir });
                    })
                  }
                >
                  {t('common.change')}
                </button>
              </div>
            </div>
            <div className="row">
              <div>
                <div className="row__label">{t('settings.format')}</div>
                <div className="row__hint">
                  {s.format === 'opus' ? t('settings.formatOpus') : s.format === 'mp3' ? t('settings.formatMp3') : t('settings.formatM4a')}
                </div>
              </div>
              <Tabs
                value={s.format}
                onChange={(format) => s.set({ format })}
                options={[
                  { value: 'opus', label: 'Opus' },
                  { value: 'm4a', label: 'M4A' },
                  { value: 'mp3', label: 'MP3' },
                ]}
              />
            </div>
            {s.format === 'mp3' && (
              <div className="row">
                <div>
                  <div className="row__label">{t('settings.bitrate')}</div>
                  <div className="row__hint">{t('settings.bitrateHint')}</div>
                </div>
                <Tabs
                  value={String(s.mp3Bitrate) as '128' | '192' | '320'}
                  onChange={(v) => s.set({ mp3Bitrate: Number(v) as 128 | 192 | 320 })}
                  options={[
                    { value: '128', label: '128' },
                    { value: '192', label: '192' },
                    { value: '320', label: '320' },
                  ]}
                />
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="h2 group__title">{t('settings.look')}</h2>
          <div className="group">
            <div className="row">
              <div>
                <div className="row__label">{t('settings.language')}</div>
                <div className="row__hint">{t('settings.languageHint')}</div>
              </div>
              <Tabs
                value={s.locale}
                onChange={(locale) => s.set({ locale })}
                options={[
                  { value: 'ru', label: 'Русский' },
                  { value: 'en', label: 'English' },
                ]}
              />
            </div>
            <div className="row">
              <div>
                <div className="row__label">{t('settings.glass')}</div>
                <div className="row__hint">{t('settings.glassHint')}</div>
              </div>
              <Toggle on={s.glassMode} onChange={(v) => s.set({ glassMode: v })} label={t('settings.glass')} />
            </div>
            <div className="row">
              <div>
                <div className="row__label">{t('settings.accent')}</div>
                <div className="row__hint">{t('settings.accentHint')}</div>
              </div>
              <Toggle on={s.dynamicAccent} onChange={(v) => s.set({ dynamicAccent: v })} label={t('settings.accent')} />
            </div>
            <div className="row">
              <div>
                <div className="row__label">{t('settings.fps')}</div>
                <div className="row__hint">{t('settings.fpsHint')}</div>
              </div>
              <Toggle on={s.showFps} onChange={(v) => s.set({ showFps: v })} label={t('settings.fps')} />
            </div>
          </div>
        </section>

        <section>
          <h2 className="h2 group__title">{t('settings.account')}</h2>
          <div className="group">
            <div className="row">
              <div style={{ minWidth: 0 }}>
                <div className="row__label">
                  {user ? `${user.name} · @${user.username}` : t('settings.accountFallback')}
                </div>
                <div className="row__hint">{t('settings.accountHint')}</div>
                <div className="row__value ellipsis" style={{ marginTop: 4 }}>
                  {API_BASE_URL}
                </div>
              </div>
              <button type="button" className="btn sm danger" onClick={() => void logout()}>
                {t('common.signOut')}
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="h2 group__title">{t('settings.keys')}</h2>
          <div className="group">
            {[
              [t('settings.keySpace'), t('settings.keyPlay')],
              ['← →', t('settings.keySeek')],
              ['Shift + ← →', t('settings.keyPrevNext')],
              ['↑ ↓', t('settings.keyVolume')],
              [t('settings.keySearchKeys'), t('settings.keySearch')],
              ['L · Q', t('settings.keyPanels')],
              ['F · Esc', t('settings.keyFull')],
              ['Alt + ← →', t('settings.keyHistory')],
            ].map(([k, v]) => (
              <div className="row" key={k} style={{ padding: '10px 20px' }}>
                <span>{v}</span>
                <span className="kbd" style={{ fontSize: 12, padding: '4px 8px' }}>
                  {k}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
