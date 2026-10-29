import { useEffect, useMemo, useRef } from 'react';
import { useT } from '@/i18n';
import { activeLineIndex, parseLrc } from '@/lib/lrc';
import { usePlayer } from '@/store/player';

export function Lyrics({ big }: { big?: boolean }) {
  const lyrics = usePlayer((s) => s.lyrics);
  const current = usePlayer((s) => s.current);
  const time = usePlayer((s) => s.time);
  const seek = usePlayer((s) => s.seek);
  const { t } = useT();
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

  if (!current) return <div className="empty">{t('lyrics.idle')}</div>;
  if (!lyrics) return <div className="empty">{t('lyrics.looking')}</div>;
  // Unsynced lyrics: same type as synced ones, all lines lit, nothing follows the playback.
  if (!lines.length && lyrics.plainLyrics)
    return (
      <div className={`lyrics lyrics--plain ${big ? 'big' : ''}`}>
        {lyrics.plainLyrics.trim().split('\n').map((l, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static text, lines never reorder
          <p key={i} className="lyrics__line">
            {l.trim() || '\u00a0'}
          </p>
        ))}
      </div>
    );
  if (!lines.length)
    return (
      <div className="empty">
        <strong>{t('lyrics.none')}</strong>
        {t('lyrics.noneHint')}
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
