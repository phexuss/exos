import { Play } from 'lucide-react';
import { useMemo } from 'react';
import { type Key, useT } from '@/i18n';
import { formatTime } from '@/lib/format';
import { useArtist, useChart, useMix, useRecent, useSimilarFirst } from '@/lib/queries';
import { useYourArtists } from '@/lib/yourArtists';
import type { Track } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { usePlayer } from '@/store/player';
import { usePlays } from '@/store/plays';
import { useMenu } from '@/components/ContextMenu';
import { Cover, DownloadButton, Eq, SkeletonRows } from '@/components/ui';
import { AlbumTile, ArtistTile } from './cards';

function greeting(): Key {
  const h = new Date().getHours();
  if (h < 5) return 'home.night';
  if (h < 12) return 'home.morning';
  if (h < 18) return 'home.afternoon';
  return 'home.evening';
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

/**
 * The chart as a ranked list: the position is the point, so it gets the type.
 * A mix has no ranks, so `ranked` off drops the number column.
 */
function RankList({ tracks, ranked = true }: { tracks: Track[]; ranked?: boolean }) {
  const playQueue = usePlayer((s) => s.playQueue);
  const currentId = usePlayer((s) => s.current?.id);
  const playing = usePlayer((s) => s.status === 'playing');
  const showMenu = useMenu((s) => s.show);
  const { t: tr } = useT();
  return (
    <ol className={ranked ? 'rank' : 'rank rank--plain'}>
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
          {ranked && <span className="rank__n tabular">{currentId === t.id ? <Eq paused={!playing} /> : i + 1}</span>}
          <button
            type="button"
            className="rank__art"
            aria-label={tr('common.playTitle', { title: t.title })}
            onClick={() => playQueue(tracks, i)}
          >
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

/** One of your artists, with the artist's own picture once it loads. */
function YourArtistTile({ page, name, coverUrl }: { page: string; name: string; coverUrl?: string }) {
  const artist = useArtist(page);
  return <ArtistTile artist={{ id: page, name, pictureUrl: artist.data?.pictureUrl ?? coverUrl }} />;
}

/** Artists in the home mix and shelf. */
const MIX_ARTISTS = 4;
const SHELF_ARTISTS = 10;

export function Home() {
  const user = useAuth((s) => s.user);
  const chart = useChart();
  const recent = useRecent();
  const played = usePlays((s) => s.recent);
  // What you listened to here first, then what the account played elsewhere; the chart only for the side list.
  const seeds = useMemo(() => {
    const out: Track[] = [];
    for (const tr of [...played, ...(recent.data ?? [])]) {
      if (tr.source === 'deezer' && !out.some((x) => x.id === tr.id)) out.push(tr);
      if (out.length === 3) break;
    }
    return out;
  }, [played, recent.data]);
  const fallbackSeed = chart.data?.tracks[0];
  const sideSeeds = useMemo(() => (seeds.length ? seeds : fallbackSeed ? [fallbackSeed] : []), [seeds, fallbackSeed]);
  const similar = useSimilarFirst(sideSeeds);
  const seed = similar.data?.seed ?? null;
  const playQueue = usePlayer((s) => s.playQueue);
  const top = chart.data?.tracks ?? [];
  const recentList = useMemo(() => recent.data ?? [], [recent.data]);
  const similarList = similar.data?.list ?? [];
  const mine = useYourArtists(SHELF_ARTISTS);
  const mineWithPage = useMemo(() => mine.filter((a) => a.page), [mine]);
  // The mix waits for the side list so it can leave out what that already shows.
  const mixSeeds = useMemo(() => (similar.loading ? [] : seeds.filter((x) => x.id !== seed?.id)), [similar.loading, seeds, seed]);
  const mixArtists = useMemo(
    () => (similar.loading ? [] : mineWithPage.slice(0, MIX_ARTISTS).map((a) => a.page!)),
    [similar.loading, mineWithPage],
  );
  const skip = useMemo(() => similarList.slice(0, 8).map((x) => x.id), [similarList]);
  const mix = useMix(mixSeeds, mixArtists, skip);
  const mixList = mix.data ?? [];
  // No history yet, or nothing came back: the chart stands in.
  const waiting = similar.loading || mix.loading;
  const showMix = mixList.length > 0;
  const list = showMix ? mixList : top;
  const { t } = useT();

  return (
    <div className="page page-enter">
      <div className="section" style={{ gap: 18 }}>
        <h1 className="h1">
          {t(greeting())}
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
            <h2 className="h2">{showMix ? t('home.mix') : t('home.chart')}</h2>
            <button type="button" className="link-btn" onClick={() => playQueue(list, 0)} disabled={!list.length}>
              {t('home.playAll')}
            </button>
          </div>
          {showMix && (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {t('home.mixHint')}
            </p>
          )}
          {showMix ? (
            <RankList tracks={mixList} ranked={false} />
          ) : waiting || chart.loading ? (
            <SkeletonRows n={8} />
          ) : chart.error ? (
            <div className="empty">
              <strong>{t('home.chartFailed')}</strong>
              {chart.error}
            </div>
          ) : (
            <RankList tracks={top.slice(0, 10)} />
          )}
        </section>

        {seed && similarList.length > 0 && (
          <section className="section aside-list" style={{ minWidth: 0 }}>
            <h2 className="h2">{t('home.similar', { title: seed.title })}</h2>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {t('home.similarHint')}
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
          <h2 className="h2">{t('home.albums')}</h2>
          <div className="grid-cards">
            {chart.data!.albums.slice(0, 12).map((a) => (
              <AlbumTile key={a.id} album={a} />
            ))}
          </div>
        </section>
      )}

      {mineWithPage.length > 0 ? (
        <section className="section">
          <h2 className="h2">{t('home.yourArtists')}</h2>
          <div className="shelf">
            {mineWithPage.map((a) => (
              <YourArtistTile key={a.key} page={a.page!} name={a.name} coverUrl={a.coverUrl} />
            ))}
          </div>
        </section>
      ) : (
        (chart.data?.artists.length ?? 0) > 0 && (
          <section className="section">
            <h2 className="h2">{t('home.artists')}</h2>
            <div className="shelf">
              {chart.data!.artists.slice(0, SHELF_ARTISTS).map((a) => (
                <ArtistTile key={a.id} artist={a} />
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
}
