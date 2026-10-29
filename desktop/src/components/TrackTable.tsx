import { Clock3, Play } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { memo, useLayoutEffect, useRef, useState } from 'react';
import { formatTime } from '@/lib/format';
import type { Track } from '@/lib/types';
import { onIntent, prefetchAlbum, prefetchArtist } from '@/lib/queries';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { useMenu } from './ContextMenu';
import { Cover, DownloadButton, Eq, SourcePill } from './ui';

type Props = {
  tracks: Track[];
  showAlbum?: boolean;
  showCover?: boolean;
  /** Narrow column: title, duration and download only. */
  compact?: boolean;
};

/** Longer lists only keep the rows near the viewport in the DOM. */
const VIRTUAL_FROM = 60;
const ROW_H = 58;

export function TrackTable({ tracks, showAlbum = true, showCover = true, compact }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const currentId = usePlayer((s) => s.current?.id);
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'loading');
  const playQueue = usePlayer((s) => s.playQueue);
  const virtual = tracks.length >= VIRTUAL_FROM;

  const row = (t: Track, i: number) => (
    <Row
      key={`${t.id}-${i}`}
      track={t}
      n={i + 1}
      showAlbum={showAlbum}
      showCover={showCover}
      selected={selected === t.id}
      current={currentId === t.id}
      playing={playing}
      onSelect={() => setSelected(t.id)}
      onPlay={() => playQueue(tracks, i)}
    />
  );

  return (
    <div className={`tt ${showAlbum ? '' : 'no-album'} ${compact ? 'compact' : ''} ${virtual ? 'tt--virtual' : ''}`} role="grid">
      <div className="tt__head" role="row">
        <span style={{ textAlign: 'center' }}>#</span>
        <span>Название</span>
        {showAlbum && <span className="tt__album">Альбом</span>}
        <span className="tt__src">Источник</span>
        <span className="tt__dur">
          <Clock3 size={14} />
        </span>
        <span />
      </div>
      {virtual ? <VirtualRows count={tracks.length} render={(i) => row(tracks[i], i)} /> : tracks.map(row)}
    </div>
  );
}

/**
 * Rows for a long list, windowed against the page's scroller. Spacers above
 * and below stand in for the rows that aren't mounted, so the scrollbar and
 * layout behave as if the whole list were there.
 */
function VirtualRows({ count, render }: { count: number; render: (i: number) => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const [margin, setMargin] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    const sc = el?.closest('.scroller') as HTMLElement | null;
    if (!el || !sc) return;
    setScroller(sc);
    const measure = () => setMargin(el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sc.firstElementChild ?? sc);
    return () => ro.disconnect();
  }, []);
  const v = useVirtualizer({
    count,
    getScrollElement: () => scroller,
    estimateSize: () => ROW_H,
    overscan: 10,
    scrollMargin: margin,
  });
  const items = v.getVirtualItems();
  const top = items.length ? items[0].start - margin : 0;
  const bottom = items.length ? v.getTotalSize() - (items[items.length - 1].end - margin) : count * ROW_H;
  return (
    <div ref={ref}>
      <div style={{ height: top }} />
      {items.map((it) => render(it.index))}
      <div style={{ height: Math.max(0, bottom) }} />
    </div>
  );
}

const Row = memo(function Row({
  track,
  n,
  showAlbum,
  showCover,
  selected,
  current,
  playing,
  onSelect,
  onPlay,
}: {
  track: Track;
  n: number;
  showAlbum: boolean;
  showCover: boolean;
  selected: boolean;
  current: boolean;
  playing: boolean;
  onSelect: () => void;
  onPlay: () => void;
}) {
  const go = useNav((s) => s.go);
  const showMenu = useMenu((s) => s.show);
  return (
    <div
      role="row"
      tabIndex={0}
      className={`tt__row ${selected ? 'is-selected' : ''} ${current ? 'is-current' : ''}`}
      onClick={onSelect}
      onDoubleClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPlay();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onSelect();
        showMenu(e.clientX, e.clientY, track, onPlay);
      }}
    >
      <span className="tt__num">
        {current ? <Eq paused={!playing} /> : <span className="n">{n}</span>}
        <button type="button" className="tt__play" aria-label={`Слушать ${track.title}`} onClick={onPlay}>
          <Play size={15} fill="currentColor" />
        </button>
      </span>
      <span className="tt__main" style={showCover ? undefined : { gridTemplateColumns: '1fr' }}>
        {showCover && <Cover src={track.coverUrl} seed={track.album ?? track.id} label={track.title} />}
        <span style={{ minWidth: 0 }}>
          <div className="tt__title ellipsis">{track.title}</div>
          <div className="tt__artist">
            {track.source === 'deezer' && track.artist.id ? (
              <button
                type="button"
                className="ellipsis"
                onClick={(e) => {
                  e.stopPropagation();
                  go({ name: 'artist', id: track.artist.id });
                }}
                {...onIntent(() => prefetchArtist(track.artist.id))}
              >
                {track.artist.name}
              </button>
            ) : (
              <span className="ellipsis">{track.artist.name}</span>
            )}
          </div>
        </span>
      </span>
      {showAlbum && (
        <span className="tt__album ellipsis">
          {track.albumId ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go({ name: 'album', id: track.albumId! });
              }}
              {...onIntent(() => prefetchAlbum(track.albumId!))}
            >
              {track.album}
            </button>
          ) : (
            track.album ?? '—'
          )}
        </span>
      )}
      <span className="tt__src">
        <SourcePill source={track.source} />
      </span>
      <span className="tt__dur">{formatTime(track.durationSec)}</span>
      <DownloadButton track={track} />
    </div>
  );
});
