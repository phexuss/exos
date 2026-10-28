import { useEffect, useMemo, useRef } from 'react';
import { activeLineIndex, parseLrc } from '@/lib/lrc';
import { usePlayer } from '@/store/player';

export function Lyrics({ big }: { big?: boolean }) {
  const lyrics = usePlayer((s) => s.lyrics);
  const current = usePlayer((s) => s.current);
  const time = usePlayer((s) => s.time);
  const seek = usePlayer((s) => s.seek);
  const lines = useMemo(() => (lyrics?.syncedLyrics ? parseLrc(lyrics.syncedLyrics) : []), [lyrics]);
  const active = activeLineIndex(lines, time);
  // How far into the active line we are, for the karaoke fill.
  const lineStart = active >= 0 ? lines[active].time : 0;
  const lineEnd = lines[active + 1]?.time ?? lineStart + 4;
  const fill = active >= 0 ? Math.max(0, Math.min(1, (time - lineStart) / Math.max(0.5, lineEnd - lineStart))) : 0;
  const ref = useRef<HTMLDivElement>(null);
  const userScrolledAt = useRef(0);

  useEffect(() => {
    if (active < 0 || Date.now() - userScrolledAt.current < 3000) return;
    const el = ref.current?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [active]);

  if (!current) return <div className="empty">Включи что-нибудь, и здесь появится текст.</div>;
  if (!lyrics) return <div className="empty">Ищу текст…</div>;
  if (!lines.length && lyrics.plainLyrics) return <div className="lyrics__plain">{lyrics.plainLyrics}</div>;
  if (!lines.length)
    return (
      <div className="empty">
        <strong>Текста нет</strong>
        LRCLIB ничего не знает об этом треке.
      </div>
    );

  return (
    <div
      ref={ref}
      className={`lyrics ${big ? 'big' : ''}`}
      onWheel={() => {
        userScrolledAt.current = Date.now();
      }}
    >
      {lines.map((l, i) => (
        <button
          type="button"
          key={`${l.time}-${i}`}
          data-i={i}
          className={`lyrics__line ${i === active ? 'is-active' : i < active ? 'is-past' : ''}`}
          style={i === active ? ({ '--p': fill } as React.CSSProperties) : undefined}
          onClick={() => {
            userScrolledAt.current = 0;
            seek(l.time);
          }}
        >
          {l.text || '♪'}
        </button>
      ))}
    </div>
  );
}
