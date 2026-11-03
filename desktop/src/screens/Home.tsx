import { Play } from 'lucide-react';
import { useMemo } from 'react';
import { type Key, useT } from '@/i18n';
import { formatTime } from '@/lib/format';
import { useArtist, useMix, useRecent, useSimilarFirst } from '@/lib/queries';
import { useYourArtists } from '@/lib/yourArtists';
import type { Track } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { usePlayer } from '@/store/player';
import { usePlays } from '@/store/plays';
import { useMenu } from '@/components/ContextMenu';
import { Cover, DownloadButton, Eq, SkeletonRows } from '@/components/ui';
import { ArtistTile } from './cards';

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
 * Tracks as a list; `ranked` adds a position column for lists where the
 * position is the point.
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
  const recent = useRecent();
  const played = usePlays((s) => s.recent);
  // What you listened to here first, then what the account played elsewhere. Any source:
  // Last.fm matches by artist and title, so a SoundCloud upload it knows works too.
  const seeds = useMemo(() => {
    const out: Track[] = [];
    for (const tr of [...played, ...(recent.data ?? [])]) {
      if (!out.some((x) => x.id === tr.id)) out.push(tr);
      if (out.length === 3) break;
    }
    return out;
  }, [played, recent.data]);
  const similar = useSimilarFirst(seeds);
  const seed = similar.data?.seed ?? null;
  const playQueue = usePlayer((s) => s.playQueue);
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
  const hasHistory = seeds.length > 0 || mineWithPage.length > 0;
  const waiting = hasHistory && (similar.loading || mix.loading);
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
            <h2 className="h2">{t('home.mix')}</h2>
            <button type="button" className="link-btn" onClick={() => playQueue(mixList, 0)} disabled={!mixList.length}>
              {t('home.playAll')}
            </button>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            {t('home.mixHint')}
          </p>
          {waiting ? (
            <SkeletonRows n={8} />
          ) : mixList.length ? (
            <RankList tracks={mixList} ranked={false} />
          ) : (
            <div className="empty">
              <strong>{t('home.mixEmpty')}</strong>
              {t('home.mixEmptyHint')}
            </div>
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

      {mineWithPage.length > 0 && (
        <section className="section">
          <h2 className="h2">{t('home.yourArtists')}</h2>
          <div className="shelf">
            {mineWithPage.map((a) => (
              <YourArtistTile key={a.key} page={a.page!} name={a.name} coverUrl={a.coverUrl} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
