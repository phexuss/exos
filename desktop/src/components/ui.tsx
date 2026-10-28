import { Check, Download, X } from 'lucide-react';
import { type CSSProperties, useRef, useState } from 'react';
import { placeholderGradient } from '@/lib/format';
import type { Source, Track } from '@/lib/types';
import { useLibrary } from '@/store/library';

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
        <img src={src} alt="" loading="lazy" draggable={false} onError={() => setFailed(true)} />
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

/** Horizontal slider for seek and volume; drags without fighting the playback clock. */
export function Slider({
  value,
  max,
  onChange,
  onCommit,
  loading,
  label,
}: {
  value: number;
  max: number;
  onChange?: (v: number) => void;
  onCommit?: (v: number) => void;
  loading?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;
  const pct = max > 0 ? Math.max(0, Math.min(100, (shown / max) * 100)) : 0;

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
        <div className="slider__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="slider__thumb" style={{ left: `${pct}%` }} />
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

export function SkeletonRows({ n = 6 }: { n?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: 48, opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}
