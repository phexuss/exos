import { Play } from 'lucide-react';
import { useMemo } from 'react';
import { formatTime } from '@/lib/format';
import * as api from '@/lib/services';
import type { Track } from '@/lib/types';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/store/auth';
import { usePlayer } from '@/store/player';
import { useMenu } from '@/components/ContextMenu';
import { Cover, DownloadButton, Eq, SkeletonRows } from '@/components/ui';
import { AlbumTile, ArtistTile } from './cards';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function QuickTile({ track, list, i }: { track: Track; list: Track[]; i: number }) {
  const playQueue = usePlayer((s) => s.playQueue);
  return (
    <button type="button" className="quick" onClick={() => playQueue(list, i)}>
      <Cover src={track.coverUrl} seed={track.album ?? track.id} label={track.title} />
      <span style={{ minWidth: 0 }}>
        <div className="quick__title ellipsis">{track.title}</div>
        <div className="muted ellipsis" style={{ fontSize: 12.5 }}>
          {track.artist.name}
        </div>
      </span>
      <span className="play-mini">
        <Play size={15} fill="currentColor" />
      </span>
    </button>
  );
}

/** The chart as a ranked list: the position is the point, so it gets the type. */
function RankList({ tracks }: { tracks: Track[] }) {
  const playQueue = usePlayer((s) => s.playQueue);
  const currentId = usePlayer((s) => s.current?.id);
  const playing = usePlayer((s) => s.status === 'playing');
  const showMenu = useMenu((s) => s.show);
  return (
    <ol className="rank">
      {tracks.map((t, i) => (
        <li
          key={t.id}
          className={`rank__row ${currentId === t.id ? 'is-current' : ''}`}
          onDoubleClick={() => playQueue(tracks, i)}
          onContextMenu={(e) => {
            e.preventDefault();
            showMenu(e.clientX, e.clientY, t, () => playQueue(tracks, i));
          }}
        >
          <span className="rank__n tabular">{currentId === t.id ? <Eq paused={!playing} /> : i + 1}</span>
          <button type="button" className="rank__art" aria-label={`Слушать ${t.title}`} onClick={() => playQueue(tracks, i)}>
            <Cover src={t.coverUrl} seed={t.album ?? t.id} label={t.title} />
            <span className="rank__play">
              <Play size={16} fill="currentColor" />
            </span>
          </button>
          <span style={{ minWidth: 0 }}>
            <div className="rank__title ellipsis">{t.title}</div>
            <div className="muted ellipsis" style={{ fontSize: 13 }}>
              {t.artist.name}
            </div>
          </span>
          <span className="muted tabular rank__dur">{formatTime(t.durationSec)}</span>
          <DownloadButton track={t} />
        </li>
      ))}
    </ol>
  );
}

export function Home() {
  const user = useAuth((s) => s.user);
  const chart = useAsync(() => api.getChart(), []);
  const recent = useAsync(() => api.getCloudRecent().catch(() => [] as Track[]), []);
  const seed = recent.data?.[0] ?? chart.data?.tracks[0] ?? null;
  const similar = useAsync(() => (seed ? api.getSimilar(seed) : Promise.resolve([])), [seed?.id]);
  const playQueue = usePlayer((s) => s.playQueue);
  const top = chart.data?.tracks ?? [];
  const recentList = useMemo(() => recent.data ?? [], [recent.data]);
  const similarList = similar.data ?? [];

  return (
    <div className="page page-enter">
      <div className="section" style={{ gap: 18 }}>
        <h1 className="h1">
          {greeting()}
          {user?.name ? `, ${user.name}` : ''}
        </h1>
        {recentList.length > 0 && (
          <div className="quick-grid">
            {recentList.slice(0, 6).map((t, i) => (
              <QuickTile key={t.id} track={t} list={recentList} i={i} />
            ))}
          </div>
        )}
      </div>

      <div className="home-split">
        <section className="section" style={{ minWidth: 0 }}>
          <div className="section__head">
            <h2 className="h2">Чарт Deezer</h2>
            <button type="button" className="link-btn" onClick={() => playQueue(top, 0)} disabled={!top.length}>
              Слушать подряд
            </button>
          </div>
          {chart.loading ? (
            <SkeletonRows n={8} />
          ) : chart.error ? (
            <div className="empty">
              <strong>Чарт не загрузился</strong>
              {chart.error}
            </div>
          ) : (
            <RankList tracks={top.slice(0, 10)} />
          )}
        </section>

        {seed && similarList.length > 0 && (
          <section className="section aside-list" style={{ minWidth: 0 }}>
            <h2 className="h2">Похоже на «{seed.title}»</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Подборка Last.fm по последнему, что ты слушал.
            </p>
            <div className="aside-list__items">
              {similarList.slice(0, 8).map((t, i) => (
                <QuickTile key={t.id} track={t} list={similarList} i={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {(chart.data?.albums.length ?? 0) > 0 && (
        <section className="section">
          <h2 className="h2">Альбомы недели</h2>
          <div className="grid-cards">
            {chart.data!.albums.slice(0, 12).map((a) => (
              <AlbumTile key={a.id} album={a} />
            ))}
          </div>
        </section>
      )}

      {(chart.data?.artists.length ?? 0) > 0 && (
        <section className="section">
          <h2 className="h2">Артисты в чарте</h2>
          <div className="shelf">
            {chart.data!.artists.slice(0, 10).map((a) => (
              <ArtistTile key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
