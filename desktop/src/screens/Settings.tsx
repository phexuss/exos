import { CheckCircle2, CircleAlert, Download, FolderOpen, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { type CookieCheck, engine, openFolder, pickFolder, type Tool, type ToolInfo } from '@/lib/engine';
import { API_BASE_URL } from '@/lib/env';
import { useAuth } from '@/store/auth';
import { useEngine } from '@/store/engine';
import { type CookiesBrowser, useSettings } from '@/store/settings';
import { Toggle } from '@/components/ui';

function CookiesCheck({ browser }: { browser: string }) {
  const [state, setState] = useState<{ for: string; busy: boolean; result?: CookieCheck; error?: string }>({
    for: browser,
    busy: false,
  });
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
        <div className="row__label">Проверить куки</div>
        <div className="row__hint">
          {current.error ? (
            <span style={{ color: 'var(--danger)' }}>{current.error}</span>
          ) : r ? (
            r.signedIn ? (
              `yt-dlp прочитал ${r.count} куки, из них ${r.youtube} от YouTube. Вход в YouTube есть.`
            ) : (
              `yt-dlp прочитал ${r.count} куки, из них ${r.youtube} от YouTube, но входа в YouTube в этом браузере нет. Войди в YouTube и проверь снова.`
            )
          ) : (
            'Прочитает куки прямо сейчас и покажет, видит ли yt-dlp вход в YouTube. Дальше они обновляются раз в полчаса.'
          )}
        </div>
      </div>
      <button type="button" className="btn sm" disabled={current.busy} onClick={run}>
        <RefreshCw size={14} className={current.busy ? 'spin-icon' : undefined} /> {current.busy ? 'Читаю…' : 'Проверить'}
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
            {info.managed ? ' · ставит EXØS' : ' · системный'}
          </div>
        )}
      </div>
      <div className="tool-status">
        {busy ? (
          <span className="muted tabular">{Math.round(installing.progress * 100)}%</span>
        ) : info ? (
          tool === 'ytdlp' && (
            <button type="button" className="btn sm" onClick={() => void updateYtdlp()} disabled={updating}>
              <RefreshCw size={14} className={updating ? 'spin-icon' : ''} /> {updating ? 'Обновляю…' : 'Обновить'}
            </button>
          )
        ) : installable ? (
          <button type="button" className="btn sm primary" onClick={() => void install(tool)}>
            <Download size={14} /> Установить
          </button>
        ) : null}
      </div>
    </div>
  );
}

const BROWSERS: [CookiesBrowser, string][] = [
  ['', 'Не использовать'],
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

  return (
    <div className="page page-enter">
      <h1 className="h1">Настройки</h1>
      <div className="settings">
        <section>
          <h2 className="h2 group__title">Локальный движок</h2>
          <div className="group">
            <ToolRow
              tool="ytdlp"
              name="yt-dlp"
              info={status?.ytdlp ?? null}
              installable={status?.installable.ytdlp ?? false}
              hint="Ищет и качает аудио с YouTube и SoundCloud прямо с этого компьютера. Обновляется сам при запуске."
              missingHint="Без него нельзя ни слушать, ни скачивать. EXØS поставит свою копию в папку приложения."
            />
            <ToolRow
              tool="deno"
              name="JS-движок для YouTube"
              info={status?.jsRuntime ?? null}
              installable={status?.installable.deno ?? false}
              hint={`YouTube проверяет клиента задачкой на JavaScript, yt-dlp решает её через ${status?.jsRuntime?.name ?? 'Deno'}.`}
              missingHint="Нужен Deno, Node или Bun. Без него YouTube часто отдаёт ошибку или пустой список форматов."
            />
            <ToolRow
              tool="ffmpeg"
              name="ffmpeg"
              info={status?.ffmpeg ?? null}
              installable={status?.installable.ffmpeg ?? false}
              hint="Склеивает HLS-потоки SoundCloud и конвертирует в mp3."
              missingHint="Без него не играют треки SoundCloud, которые отдаются только через HLS, и не работает формат mp3. На macOS: brew install ffmpeg, на Linux: пакет ffmpeg."
            />
            <div className="row">
              <div>
                <div className="row__label">Куки браузера для YouTube</div>
                <div className="row__hint">
                  Если YouTube пишет «Sign in to confirm you’re not a bot», yt-dlp возьмёт куки из браузера, где ты
                  вошёл в YouTube. Куки не покидают компьютер.
                </div>
              </div>
              <select
                id="cookies-browser"
                className="select"
                value={s.cookiesBrowser}
                onChange={(e) => s.set({ cookiesBrowser: e.target.value as CookiesBrowser })}
              >
                {BROWSERS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {s.cookiesBrowser && <CookiesCheck browser={s.cookiesBrowser} />}
          </div>
        </section>

        <section>
          <h2 className="h2 group__title">Скачивание</h2>
          <div className="group">
            <div className="row">
              <div style={{ minWidth: 0 }}>
                <div className="row__label">Папка с музыкой</div>
                <div className="row__value ellipsis" style={{ marginTop: 4 }}>
                  {musicDir}
                </div>
              </div>
              <div className="tool-status">
                <button type="button" className="btn sm" onClick={() => void openFolder(musicDir)}>
                  <FolderOpen size={14} /> Открыть
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
                  Изменить
                </button>
              </div>
            </div>
            <div className="row">
              <div>
                <div className="row__label">Формат</div>
                <div className="row__hint">
                  M4A (AAC) скачивается с YouTube как есть, без перекодирования. MP3 перекодируется ffmpeg и
                  открывается вообще везде.
                </div>
              </div>
              <div className="tabs">
                <button type="button" className={s.format === 'm4a' ? 'is-active' : ''} onClick={() => s.set({ format: 'm4a' })}>
                  M4A
                </button>
                <button type="button" className={s.format === 'mp3' ? 'is-active' : ''} onClick={() => s.set({ format: 'mp3' })}>
                  MP3
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="h2 group__title">Внешний вид</h2>
          <div className="group">
            <div className="row">
              <div>
                <div className="row__label">Стекло</div>
                <div className="row__hint">
                  Панели из матового стекла поверх размытой обложки текущего трека. На компьютере размытие считает
                  видеокарта, поэтому оно включено по умолчанию.
                </div>
              </div>
              <Toggle on={s.glassMode} onChange={(v) => s.set({ glassMode: v })} label="Стекло" />
            </div>
            <div className="row">
              <div>
                <div className="row__label">Цвет из обложки</div>
                <div className="row__hint">Акцентный цвет подстраивается под обложку того, что играет.</div>
              </div>
              <Toggle on={s.dynamicAccent} onChange={(v) => s.set({ dynamicAccent: v })} label="Цвет из обложки" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="h2 group__title">Аккаунт</h2>
          <div className="group">
            <div className="row">
              <div style={{ minWidth: 0 }}>
                <div className="row__label">{user ? `${user.name} · @${user.username}` : 'Аккаунт EXØS'}</div>
                <div className="row__hint">
                  Поиск, тексты и рекомендации идут через сервер EXØS, история и список скачанного синхронизируются с
                  телефоном. Сам звук сервер не трогает.
                </div>
                <div className="row__value ellipsis" style={{ marginTop: 4 }}>
                  {API_BASE_URL}
                </div>
              </div>
              <button type="button" className="btn sm danger" onClick={() => void logout()}>
                Выйти
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="h2 group__title">Клавиши</h2>
          <div className="group">
            {[
              ['Пробел', 'Играть / пауза'],
              ['← →', 'Перемотка на 5 секунд'],
              ['Shift + ← →', 'Предыдущий / следующий трек'],
              ['↑ ↓', 'Громкость'],
              ['Ctrl + K или /', 'Поиск'],
              ['L · Q', 'Текст · очередь'],
              ['F · Esc', 'Плеер на всё окно · свернуть'],
              ['Alt + ← →', 'Назад / вперёд'],
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
