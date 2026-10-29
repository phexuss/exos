import { Check, Download, X } from 'lucide-react';
import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { placeholderGradient } from '@/lib/format';
import type { Source, Track } from '@/lib/types';
import { useLibrary } from '@/store/library';
import { imageUrl } from '@/lib/bridge';

export function Cover({
  src,
  seed,
  label,
  round,
  style,
  className = '',
}: {
  src?: string;
  seed: string;
  label?: string;
  round?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  return (
    <div className={`cover ${round ? 'round' : ''} ${className}`} style={style}>
      {showImg ? (
        <img src={imageUrl(src)} alt="" loading="lazy" draggable={false} onError={() => setFailed(true)} />
      ) : (
        <div className="cover__ph" style={{ background: placeholderGradient(seed) }}>
          <span style={{ fontSize: '42cqw' }}>{(label ?? seed).trim().charAt(0).toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}

export function SourcePill({ source }: { source: Source | 'local' }) {
  const label = source === 'deezer' ? 'Deezer' : source === 'soundcloud' ? 'SC' : 'На диске';
  return <span className={`src-pill ${source}`}>{label}</span>;
}

export function Eq({ paused }: { paused?: boolean }) {
  return (
    <span className={`eq ${paused ? 'paused' : ''}`} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
    />
  );
}

/**
 * Horizontal slider for seek and volume; drags without fighting the playback
 * clock. With `live`, the fill follows that clock every frame (moving only a
 * transform), so the seek bar glides at the display's refresh rate instead of
 * stepping four times a second with the audio element's timeupdate.
 */
export function Slider({
  value,
  max,
  onChange,
  onCommit,
  loading,
  label,
  live,
}: {
  value: number;
  max: number;
  onChange?: (v: number) => void;
  onCommit?: (v: number) => void;
  loading?: boolean;
  label: string;
  live?: () => number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;

  const paint = useCallback(
    (v: number) => {
      const f = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;
      if (fill.current) fill.current.style.transform = `scaleX(${f})`;
      if (track.current) track.current.style.transform = `translateX(${f * 100}%)`;
    },
    [max],
  );
  useLayoutEffect(() => paint(shown), [paint, shown]);
  useEffect(() => {
    if (!live || drag !== null) return;
    let raf = 0;
    const tick = () => {
      paint(live());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, drag, paint]);

  const valueAt = (clientX: number) => {
    const rect = ref.current!.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * max;
  };

  return (
    <div
      ref={ref}
      className={`slider ${drag !== null ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(shown)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (!onCommit || !max) return;
        const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        onCommit(Math.max(0, Math.min(max, value + step * max * 0.05)));
      }}
      onPointerDown={(e) => {
        if (!max) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const v = valueAt(e.clientX);
        setDrag(v);
        onChange?.(v);
      }}
      onPointerMove={(e) => {
        if (drag === null) return;
        const v = valueAt(e.clientX);
        setDrag(v);
        onChange?.(v);
      }}
      onPointerUp={(e) => {
        if (drag === null) return;
        const v = valueAt(e.clientX);
        setDrag(null);
        onCommit?.(v);
      }}
      onWheel={(e) => {
        if (!onCommit || !max) return;
        onCommit(Math.max(0, Math.min(max, value - Math.sign(e.deltaY) * max * 0.05)));
      }}
    >
      <div className="slider__rail">
        <div className="slider__fill" ref={fill} />
      </div>
      <div className="slider__track" ref={track}>
        <div className="slider__thumb" />
      </div>
    </div>
  );
}

function Ring({ progress, spin }: { progress: number; spin?: boolean }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" className={`dl-ring ${spin ? 'spin' : ''}`}>
      <circle className="track" cx="11" cy="11" r={r} />
      <circle
        className="bar"
        cx="11"
        cy="11"
        r={r}
        strokeDasharray={c}
        strokeDashoffset={spin ? c * 0.75 : c * (1 - progress)}
      />
    </svg>
  );
}

export function DownloadButton({ track }: { track: Track }) {
  const downloaded = useLibrary((s) => s.tracks.some((t) => t.id === track.id));
  const job = useLibrary((s) => s.jobs[track.id]);
  const download = useLibrary((s) => s.download);
  const cancel = useLibrary((s) => s.cancel);
  const [hover, setHover] = useState(false);

  if (downloaded) {
    return (
      <span className="dl-btn done" title="Скачан на этот компьютер">
        <Check size={18} />
      </span>
    );
  }
  const active = job && job.stage !== 'done' && job.stage !== 'error';
  if (active) {
    const spin = job.stage === 'queued' || job.stage === 'resolving';
    return (
      <button
        type="button"
        className="dl-btn"
        title="Отменить скачивание"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          cancel(track.id);
        }}
      >
        {hover ? <X size={16} /> : <Ring progress={job.progress} spin={spin} />}
      </button>
    );
  }
  return (
    <button
      type="button"
      className="dl-btn"
      title="Скачать через yt-dlp на этом компьютере"
      onClick={(e) => {
        e.stopPropagation();
        download(track);
      }}
    >
      <Download size={18} />
    </button>
  );
}

/** Grey stand-ins shaped like track rows: cover, two lines, length. */
export function SkeletonRows({ n = 6, cover = true }: { n?: number; cover?: boolean }) {
  return (
    <div className="sk-rows" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="sk-row" style={{ opacity: 1 - i * (0.7 / n) }}>
          <span className="skeleton sk-num" />
          {cover && <span className="skeleton sk-cover" />}
          <span className="sk-lines">
            <span className="skeleton" style={{ width: `${46 + ((i * 37) % 34)}%` }} />
            <span className="skeleton" style={{ width: `${22 + ((i * 23) % 18)}%` }} />
          </span>
          <span className="skeleton sk-dur" />
        </div>
      ))}
    </div>
  );
}

/** The album page before its data: sleeve, title, actions, rows. */
export function AlbumSkeleton() {
  return (
    <div className="page" aria-busy>
      <header className="detail-head">
        <span className="skeleton sk-sleeve" />
        <div className="detail-head__body">
          <span className="skeleton" style={{ height: 52, width: '60%' }} />
          <span className="skeleton" style={{ height: 16, width: '36%' }} />
        </div>
      </header>
      <div className="actions">
        <span className="skeleton" style={{ width: 56, height: 56, borderRadius: '50%' }} />
        <span className="skeleton" style={{ width: 200, height: 38, borderRadius: 999 }} />
      </div>
      <SkeletonRows n={10} cover={false} />
    </div>
  );
}

/** The artist page before its data: banner, name, popular tracks. */
export function ArtistSkeleton() {
  return (
    <div className="page" aria-busy>
      <header className="artist-banner">
        <span className="skeleton artist-banner__photo" style={{ borderRadius: 0 }} />
        <div className="artist-banner__body" style={{ width: '100%' }}>
          <span className="skeleton" style={{ height: 84, width: '50%' }} />
          <span className="skeleton" style={{ height: 16, width: '28%' }} />
        </div>
      </header>
      <SkeletonRows n={5} />
    </div>
  );
}
