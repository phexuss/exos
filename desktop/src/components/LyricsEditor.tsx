import { Check, FileUp, LoaderCircle, Pause, Play, RotateCcw, Search, Timer, Undo2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type DragEvent, type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/i18n';
import { formatTime, primaryArtist } from '@/lib/format';
import { lrcStamp, plainFrom, readLyrics, toLrc } from '@/lib/lrc';
import { reducedMotion } from '@/lib/motion';
import { findLyrics } from '@/lib/services';
import { snappy } from '@/lib/springs';
import type { LrcLibEntry, Lyrics, Track } from '@/lib/types';
import { useLibrary } from '@/store/library';
import { useUserLyrics } from '@/store/lyrics';
import { usePlayer } from '@/store/player';
import { toast } from '@/store/toast';
import { Tabs } from './Tabs';

type Mode = 'text' | 'find' | 'sync';

/** LRCLIB entries within this many seconds of the track are marked as the same recording. */
const NEAR_LENGTH_S = 3;
const FILE_TYPES = '.lrc,.srt,.txt,text/plain';

/** What the track shows right now, as one editable string: synced if there is any, else plain. */
function startingText(track: Track): string {
  const mine = useUserLyrics.getState().get(track.id);
  const { lyrics, lyricsFor } = usePlayer.getState();
  const found: Lyrics | null | undefined =
    mine ?? (lyricsFor === track.id ? lyrics : null) ?? useLibrary.getState().get(track.id);
  return found?.syncedLyrics?.trim() || found?.plainLyrics?.trim() || '';
}

export function LyricsEditor() {
  const track = useUserLyrics((s) => s.editing);
  return <AnimatePresence>{track && <Editor key={track.id} track={track} />}</AnimatePresence>;
}

function Editor({ track }: { track: Track }) {
  const { t, tn } = useT();
  const close = () => useUserLyrics.getState().edit(null);
  const hasMine = useUserLyrics((s) => !!s.byId[track.id]);
  const [mode, setMode] = useState<Mode>('text');
  const [text, setText] = useState(() => startingText(track));
  const parsed = useMemo(() => readLyrics(text), [text]);
  const file = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const save = () => {
    if (parsed.kind === 'empty') return;
    useUserLyrics
      .getState()
      .save(
        track,
        parsed.kind === 'synced'
          ? { syncedLyrics: parsed.lrc, plainLyrics: plainFrom(parsed.lrc) }
          : { plainLyrics: parsed.text },
      );
    if (usePlayer.getState().current?.id === track.id) usePlayer.getState().reloadLyrics();
    toast(t('lyrics.saved', { title: track.title }));
    close();
  };

  const restore = () => {
    useUserLyrics.getState().remove(track.id);
    if (usePlayer.getState().current?.id === track.id) usePlayer.getState().reloadLyrics();
    toast(t('lyrics.restored', { title: track.title }));
    close();
  };

  const readFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      setText(await f.text());
      setMode('text');
    } catch {
      toast(t('lyrics.fileFailed', { name: f.name }), 'error');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void readFile(e.dataTransfer.files[0]);
  };

  // Global hotkeys stand down while the editor is open (see useHotkeys); Esc is ours.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (mode === 'sync') setMode('text');
      else close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  const status =
    parsed.kind === 'synced'
      ? `${t(parsed.from === 'srt' ? 'lyrics.kindSrt' : 'lyrics.kindSynced')} · ${tn('lines', parsed.lines.length)}`
      : parsed.kind === 'plain'
        ? `${t('lyrics.kindPlain')} · ${tn('lines', parsed.lines.length)}`
        : '';
  const syncLines = useMemo(() => plainFrom(text).split('\n').map((l) => l.trim()).filter(Boolean), [text]);

  return (
    <motion.div
      className="lyed-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <motion.div
        className="lyed"
        role="dialog"
        aria-modal="true"
        aria-label={t('lyrics.editorTitle')}
        initial={reducedMotion() ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reducedMotion() ? undefined : { opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.14 } }}
        transition={snappy}
      >
        <header className="lyed__head">
          <div className="lyed__title">
            <h2>{t('lyrics.editorTitle')}</h2>
            <p className="ellipsis">
              {track.title} · {track.artist.name}
            </p>
          </div>
          {mode !== 'sync' && (
            <Tabs<Mode>
              value={mode}
              onChange={setMode}
              options={[
                { value: 'text', label: t('lyrics.tabText') },
                { value: 'find', label: t('lyrics.tabFind') },
              ]}
            />
          )}
          <button type="button" className="icon-btn sm" aria-label={t('common.cancel')} onClick={close}>
            <X size={16} />
          </button>
        </header>

        {mode === 'text' && (
          <>
            <div
              className={`lyed__body lyed__write ${dragOver ? 'is-drop' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <textarea
                className={`lyed__text ${parsed.kind === 'synced' ? 'is-lrc' : ''}`}
                value={text}
                spellCheck={false}
                placeholder={t('lyrics.placeholder')}
                onChange={(e) => setText(e.target.value)}
                autoFocus
              />
              <div className="lyed__tools">
                <span className="lyed__status">{status}</span>
                <span style={{ flex: 1 }} />
                <input
                  ref={file}
                  type="file"
                  accept={FILE_TYPES}
                  hidden
                  onChange={(e) => {
                    void readFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button type="button" className="btn sm" onClick={() => file.current?.click()}>
                  <FileUp size={15} /> {t('lyrics.openFile')}
                </button>
                {parsed.kind === 'synced' && (
                  <button type="button" className="btn sm" onClick={() => setText(plainFrom(text))}>
                    {t('lyrics.stripTimes')}
                  </button>
                )}
                <button type="button" className="btn sm" disabled={!syncLines.length} onClick={() => setMode('sync')}>
                  <Timer size={15} /> {t('lyrics.sync')}
                </button>
              </div>
            </div>
            <footer className="lyed__foot">
              {hasMine && (
                <button type="button" className="link-btn" onClick={restore}>
                  {t('lyrics.restore')}
                </button>
              )}
              <span style={{ flex: 1 }} />
              <button type="button" className="btn" onClick={close}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn primary" disabled={parsed.kind === 'empty'} onClick={save}>
                {t('lyrics.save')}
              </button>
            </footer>
          </>
        )}

        {mode === 'find' && (
          <Finder
            track={track}
            onUse={(lyrics) => {
              setText(lyrics);
              setMode('text');
            }}
          />
        )}

        {mode === 'sync' && (
          <Syncer
            track={track}
            lines={syncLines}
            onCancel={() => setMode('text')}
            onDone={(lrc) => {
              setText(lrc);
              setMode('text');
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

/* ---------- LRCLIB search ---------- */

function Finder({ track, onUse }: { track: Track; onUse: (lyrics: string) => void }) {
  const { t } = useT();
  const [query, setQuery] = useState(`${primaryArtist(track.artist.name)} ${track.title}`);
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; error?: string }>({
    status: 'idle',
  });
  const [hits, setHits] = useState<LrcLibEntry[]>([]);
  const [picked, setPicked] = useState<LrcLibEntry | null>(null);
  const seq = useRef(0);

  const run = async (e?: FormEvent) => {
    e?.preventDefault();
    const id = ++seq.current;
    setState({ status: 'loading' });
    try {
      const found = await findLyrics(query);
      if (id !== seq.current) return;
      // Same recording first, then synced before plain.
      const near = (h: LrcLibEntry) => !!track.durationSec && Math.abs((h.duration ?? 0) - track.durationSec) <= NEAR_LENGTH_S;
      found.sort((a, b) => Number(near(b)) - Number(near(a)) || Number(!!b.syncedLyrics) - Number(!!a.syncedLyrics));
      setHits(found);
      setPicked(found[0] ?? null);
      setState({ status: 'done' });
    } catch (err) {
      if (id === seq.current) setState({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  };

  // The first search runs on its own with the track's artist and title.
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, on open
  useEffect(() => {
    void run();
  }, []);

  const preview = picked ? (picked.syncedLyrics ? plainFrom(picked.syncedLyrics) : picked.plainLyrics ?? '') : '';
  const isNear = (h: LrcLibEntry) =>
    !!track.durationSec && !!h.duration && Math.abs(h.duration - track.durationSec) <= NEAR_LENGTH_S;

  return (
    <div className="lyed__body lyed__find">
      <form className="searchbox lyed__query" onSubmit={run}>
        <Search size={16} />
        <input
          value={query}
          spellCheck={false}
          placeholder={t('lyrics.findPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn sm" disabled={!query.trim() || state.status === 'loading'}>
          {t('lyrics.find')}
        </button>
      </form>

      {state.status === 'loading' && (
        <div className="empty lyed__empty">
          <LoaderCircle size={22} className="login__spin" />
          {t('lyrics.finding')}
        </div>
      )}
      {state.status === 'error' && (
        <div className="empty lyed__empty">{t('lyrics.findFailed', { error: state.error ?? '' })}</div>
      )}
      {state.status === 'done' && !hits.length && <div className="empty lyed__empty">{t('lyrics.findNothing')}</div>}

      {state.status === 'done' && hits.length > 0 && (
        <div className="lyed__split">
          <ul className="lyed__hits">
            {hits.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  className={`lyed__hit ${picked?.id === h.id ? 'is-picked' : ''}`}
                  onClick={() => setPicked(h)}
                >
                  <span className="lyed__hit-title ellipsis">{h.trackName}</span>
                  <span className="lyed__hit-sub ellipsis">
                    {h.artistName}
                    {h.albumName ? ` · ${h.albumName}` : ''}
                  </span>
                  <span className="lyed__hit-meta">
                    <span className={`lyed__badge ${h.syncedLyrics ? 'is-synced' : ''}`}>
                      {t(h.syncedLyrics ? 'lyrics.badgeSynced' : 'lyrics.badgePlain')}
                    </span>
                    {h.duration ? <span className="tabular">{formatTime(h.duration)}</span> : null}
                    {isNear(h) && <span className="lyed__near">{t('lyrics.nearLength')}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="lyed__preview">
            {picked ? (
              <>
                <pre className="lyed__preview-text">{preview}</pre>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => onUse(picked.syncedLyrics?.trim() || picked.plainLyrics?.trim() || '')}
                >
                  <Check size={16} /> {t('lyrics.use')}
                </button>
              </>
            ) : (
              <div className="empty lyed__empty">{t('lyrics.findPick')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- tap-along sync ---------- */

function Syncer({
  track,
  lines,
  onCancel,
  onDone,
}: {
  track: Track;
  lines: string[];
  onCancel: () => void;
  onDone: (lrc: string) => void;
}) {
  const { t } = useT();
  const isCurrent = usePlayer((s) => s.current?.id === track.id);
  const playing = usePlayer((s) => s.status === 'playing');
  const time = usePlayer((s) => s.time);
  const [stamps, setStamps] = useState<number[]>([]);
  const list = useRef<HTMLOListElement>(null);
  const next = stamps.length;
  const done = next >= lines.length;

  const stamp = () => {
    if (!isCurrent || done) return;
    // A tap can't land before the line above it, even after seeking back.
    const at = Math.max(usePlayer.getState().time, stamps[next - 1] ?? 0);
    setStamps([...stamps, at]);
  };
  const undo = () => {
    if (!stamps.length) return;
    const prev = stamps.slice(0, -1);
    setStamps(prev);
    // Back to a bit before the undone line, so it can be caught again.
    usePlayer.getState().seek(Math.max(0, (prev[prev.length - 1] ?? 0) - 1));
  };
  const restart = () => {
    setStamps([]);
    const p = usePlayer.getState();
    p.seek(0);
    if (p.status !== 'playing') p.toggle();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      if (e.key === ' ') {
        e.preventDefault();
        stamp();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>(`[data-i="${Math.min(next, lines.length - 1)}"]`)
      ?.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [next, lines.length]);

  return (
    <>
      <div className="lyed__body lyed__sync">
        {isCurrent ? (
          <p className="lyed__hint">{t('lyrics.syncHint')}</p>
        ) : (
          <div className="lyed__notice">
            <span>{t('lyrics.syncNotPlaying')}</span>
            <button type="button" className="btn sm" onClick={() => usePlayer.getState().playTrack(track)}>
              <Play size={14} /> {t('lyrics.syncPlay')}
            </button>
          </div>
        )}
        <div className="lyed__deck">
          <button type="button" className="btn sm" disabled={!isCurrent} onClick={restart}>
            <RotateCcw size={15} /> {t('lyrics.syncRestart')}
          </button>
          <button
            type="button"
            className="icon-btn"
            disabled={!isCurrent}
            aria-label={t(playing ? 'player.pause' : 'common.play')}
            onClick={() => usePlayer.getState().toggle()}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <span className="lyed__clock tabular">{isCurrent ? lrcStamp(time).slice(1, -1) : '--:--.--'}</span>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn sm" disabled={!stamps.length} onClick={undo}>
            <Undo2 size={15} /> {t('lyrics.syncUndo')} <span className="kbd">⌫</span>
          </button>
          <button type="button" className="btn primary lyed__stamp" disabled={!isCurrent || done} onClick={stamp}>
            {t('lyrics.syncStamp')} <span className="kbd">{t('player.space')}</span>
          </button>
        </div>
        <ol className="lyed__lines" ref={list}>
          {lines.map((l, i) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: lines are fixed while syncing
              key={i}
              data-i={i}
              className={i < next ? 'is-set' : i === next ? 'is-next' : ''}
            >
              <button
                type="button"
                disabled={i >= next || !isCurrent}
                onClick={() => usePlayer.getState().seek(stamps[i])}
              >
                <span className="lyed__at tabular">{i < next ? lrcStamp(stamps[i]).slice(1, -1) : '–'}</span>
                <span className="lyed__words">{l}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <footer className="lyed__foot">
        <span className="lyed__status">{done ? '' : t('lyrics.syncLeft', { n: lines.length - next })}</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn" onClick={onCancel}>
          {t('lyrics.syncBack')}
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!done}
          onClick={() => onDone(toLrc(lines.map((text, i) => ({ time: stamps[i], text }))))}
        >
          {t('lyrics.syncDone')}
        </button>
      </footer>
    </>
  );
}
