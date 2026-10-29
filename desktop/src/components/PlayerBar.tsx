import {
  Maximize2,
  Mic2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  ListMusic,
  LoaderCircle,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { formatTime } from '@/lib/format';
import { flyPressedCoverTo } from '@/lib/motion';
import { useNav } from '@/store/nav';
import { playhead, usePlayer } from '@/store/player';
import { useSettings } from '@/store/settings';
import { Cover, DownloadButton, Slider, SourcePill } from './ui';

function Seek() {
  const time = usePlayer((s) => s.time);
  const duration = usePlayer((s) => s.duration);
  const loading = usePlayer((s) => s.status === 'loading');
  const playing = usePlayer((s) => s.status === 'playing');
  const seek = usePlayer((s) => s.seek);
  return (
    <div className="player__seek tabular">
      <span>{formatTime(time)}</span>
      <Slider value={time} max={duration} onCommit={seek} loading={loading} label="Позиция" live={playing ? playhead : undefined} />
      <span>{formatTime(duration)}</span>
    </div>
  );
}

function Volume() {
  const volume = useSettings((s) => s.volume);
  const setVolume = usePlayer((s) => s.setVolume);
  const before = useRef(0.8);
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  return (
    <div className="volume">
      <button
        type="button"
        className="icon-btn sm"
        aria-label={volume === 0 ? 'Включить звук' : 'Выключить звук'}
        onClick={() => {
          if (volume > 0) {
            before.current = volume;
            setVolume(0);
          } else setVolume(before.current || 0.8);
        }}
      >
        <Icon size={18} />
      </button>
      <Slider value={volume} max={1} onChange={setVolume} onCommit={setVolume} label="Громкость" />
    </div>
  );
}

export function PlayerBar() {
  const current = usePlayer((s) => s.current);
  const status = usePlayer((s) => s.status);
  const note = usePlayer((s) => s.loadingNote);
  const repeat = usePlayer((s) => s.repeat);
  const shuffle = usePlayer((s) => s.shuffle);
  const panel = usePlayer((s) => s.panel);
  const canNext = usePlayer((s) => s.index < s.queue.length - 1 || s.repeat === 'all');
  const p = usePlayer.getState();
  const go = useNav((s) => s.go);
  const nowRef = useRef<HTMLDivElement>(null);
  const currentId = current?.id;

  useEffect(() => {
    if (!currentId) return;
    requestAnimationFrame(() => flyPressedCoverTo(nowRef.current?.querySelector('.cover') ?? null));
  }, [currentId]);

  return (
    <footer className={`player slab ${status === 'playing' ? 'is-playing' : ''}`}>
      <div className="player__now" ref={nowRef}>
        {current ? (
          <>
            <button type="button" onClick={() => p.setNowPlaying(true)} aria-label="Открыть плеер на всё окно">
              <Cover src={current.coverUrl} seed={current.album ?? current.id} label={current.title} />
            </button>
            <div key={current.id} className="player__text" style={{ minWidth: 0 }}>
              <div className="player__title ellipsis">{current.title}</div>
              {note ? (
                <div className="player__note ellipsis">{note}</div>
              ) : (
                <div className="player__artist ellipsis" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <SourcePill source={current.source} />
                  {current.source === 'deezer' && current.artist.id ? (
                    <button type="button" className="ellipsis" onClick={() => go({ name: 'artist', id: current.artist.id })}>
                      {current.artist.name}
                    </button>
                  ) : (
                    <span className="ellipsis">{current.artist.name}</span>
                  )}
                </div>
              )}
            </div>
            <DownloadButton track={current} />
          </>
        ) : (
          <div className="muted" style={{ gridColumn: '1 / -1', fontSize: 13 }}>
            Двойной клик по треку, чтобы включить
          </div>
        )}
      </div>

      <div className="player__center">
        <div className="player__controls">
          <button
            type="button"
            className={`icon-btn sm ${shuffle ? 'is-on' : ''}`}
            onClick={p.toggleShuffle}
            aria-label="Перемешать"
            title="Перемешать"
          >
            <Shuffle size={17} />
          </button>
          <button type="button" className="icon-btn" onClick={p.prev} disabled={!current} aria-label="Предыдущий" title="Предыдущий (Shift+←)">
            <SkipBack size={20} fill="currentColor" />
          </button>
          <button type="button" className={`play-btn ${status}`} onClick={p.toggle} disabled={!current} aria-label={status === 'playing' ? 'Пауза' : 'Играть'} title="Пробел">
            {status === 'loading' ? (
              <LoaderCircle size={20} className="spin-icon" />
            ) : status === 'playing' ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>
          <button type="button" className="icon-btn" onClick={p.next} disabled={!canNext} aria-label="Следующий" title="Следующий (Shift+→)">
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button
            type="button"
            className={`icon-btn sm ${repeat !== 'off' ? 'is-on' : ''}`}
            onClick={p.cycleRepeat}
            aria-label="Повтор"
            title={repeat === 'one' ? 'Повтор трека' : repeat === 'all' ? 'Повтор очереди' : 'Повтор выключен'}
          >
            {repeat === 'one' ? <Repeat1 size={17} /> : <Repeat size={17} />}
          </button>
        </div>
        <Seek />
      </div>

      <div className="player__right">
        <button
          type="button"
          className={`icon-btn ${panel === 'lyrics' ? 'is-on' : ''}`}
          onClick={() => p.togglePanel('lyrics')}
          aria-label="Текст"
          title="Текст (L)"
        >
          <Mic2 size={18} />
        </button>
        <button
          type="button"
          className={`icon-btn ${panel === 'queue' ? 'is-on' : ''}`}
          onClick={() => p.togglePanel('queue')}
          aria-label="Очередь"
          title="Очередь (Q)"
        >
          <ListMusic size={18} />
        </button>
        <Volume />
        <button
          type="button"
          className="icon-btn"
          disabled={!current}
          onClick={() => p.setNowPlaying(true)}
          aria-label="На всё окно"
          title="На всё окно (F)"
        >
          <Maximize2 size={17} />
        </button>
      </div>
    </footer>
  );
}
