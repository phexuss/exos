import { History, Link2, SearchX, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/i18n';
import { formatTime } from '@/lib/format';
import { importSource } from '@/lib/importer';
import { imageUrl } from '@/lib/bridge';
import { placeholderGradient } from '@/lib/format';
import { onIntent, prefetchArtist, useArtist, useChart, useSearch } from '@/lib/queries';
import type { Track } from '@/lib/types';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { useLibrary } from '@/store/library';
import { type ArtistStat, artistKey, decayed, statFor, usePlays } from '@/store/plays';
import { usePlaylists } from '@/store/playlists';
import { useSearchHistory } from '@/store/searchHistory';
import { Cover, SkeletonRows, SourcePill } from '@/components/ui';
import { Tabs } from '@/components/Tabs';
import { PlayFab } from '@/components/PlayFab';
import { TrackTable } from '@/components/TrackTable';
import { ImportScreen } from './Import';

type Tab = 'deezer' | 'soundcloud';

function isLink(q: string): boolean {
  return /^https?:\/\/(\S+\.)?(soundcloud\.com|youtube\.com|youtu\.be)\//i.test(q.trim());
}

function linkTrack(url: string): Track {
  const sc = /soundcloud\.com/i.test(url);
  const path = url.replace(/^https?:\/\/[^/]+\//, '').replace(/[?#].*$/, '');
  const [who, slug] = path.split('/');
  return {
    id: `link_${url}`,
    title: (slug ?? who ?? url).replace(/[-_]+/g, ' '),
    artist: { id: '', name: sc ? (who ?? 'SoundCloud') : 'YouTube' },
    durationSec: 0,
    isrc: url,
    source: 'soundcloud',
  };
}

function TopResult({ track, list }: { track: Track; list: Track[] }) {
  const playQueue = usePlayer((s) => s.playQueue);
  const { t } = useT();
  return (
    <div className="top-result" onDoubleClick={() => playQueue(list, 0)}>
      <Cover src={track.coverUrl} seed={track.album ?? track.id} label={track.title} />
      <div style={{ minWidth: 0 }}>
        <div className="top-result__title ellipsis">{track.title}</div>
        <div className="muted" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <SourcePill source={track.source} />
          <span className="ellipsis">{track.artist.name}</span>
          {track.durationSec > 0 && <span>· {formatTime(track.durationSec)}</span>}
        </div>
      </div>
      <PlayFab tracks={list} label={t('common.playTitle', { title: track.title })} match={[track]} />
    </div>
  );
}

/**
 * Remembers the query and the track when a track from `list` starts playing here.
 * A track that was already playing when the results opened does not count.
 */
function useRememberPlays(query: string, list: Track[]) {
  const currentId = usePlayer((s) => s.current?.id);
  const initial = useRef(currentId);
  useEffect(() => {
    if (!currentId || currentId === initial.current) return;
    initial.current = undefined;
    const track = list.find((tr) => tr.id === currentId);
    if (!track) return;
    const h = useSearchHistory.getState();
    h.addQuery(query);
    h.addTrack(track);
  }, [currentId, list, query]);
}

function RecentSearches() {
  const { queries, removeQuery, clearQueries } = useSearchHistory();
  const go = useNav((s) => s.go);
  const { t } = useT();
  if (!queries.length) return null;
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="h2">{t('search.recent')}</h2>
        <button type="button" className="link-btn" onClick={clearQueries}>
          {t('search.clear')}
        </button>
      </div>
      <div className="mood-cloud">
        {queries.map((q) => (
          <span key={q} className="mood recent-q">
            <button type="button" className="recent-q__go" onClick={() => go({ name: 'search', q })}>
              <History size={16} />
              <span className="ellipsis">{q}</span>
            </button>
            <button
              type="button"
              className="recent-q__x"
              aria-label={t('search.forget', { q })}
              title={t('search.forget', { q })}
              onClick={() => removeQuery(q)}
            >
              <X size={15} />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}

function RecentTracks() {
  const { tracks, removeTrack, clearTracks } = useSearchHistory();
  const { t } = useT();
  if (!tracks.length) return null;
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="h2">{t('search.played')}</h2>
        <button type="button" className="link-btn" onClick={clearTracks}>
          {t('search.clear')}
        </button>
      </div>
      <TrackTable tracks={tracks} showAlbum={false} onRemove={removeTrack} removeLabel={t('search.forgetTrack')} />
    </section>
  );
}

function LinkResult({ query }: { query: string }) {
  const { t } = useT();
  const [list] = useState(() => [linkTrack(query)]);
  useRememberPlays(query, list);
  return (
    <div className="page page-enter">
      <h1 className="h1">{t('search.link')}</h1>
      <div className="search-split">
        <TopResult track={list[0]} list={list} />
        <div className="empty" style={{ alignItems: 'flex-start', textAlign: 'left', padding: 0 }}>
          <Link2 size={28} />
          <strong>{t('search.linkTitle')}</strong>
          {t('search.linkHint')}
        </div>
      </div>
    </div>
  );
}

/** How many artists the search start page shows. */
const ARTISTS_SHOWN = 12;

/**
 * Artists by plays, plus what is downloaded and in playlists (one play each,
 * dated when it got there), so a fresh install with a library is not empty.
 */
function useYourArtists(): (ArtistStat & { key: string })[] {
  const artists = usePlays((s) => s.artists);
  const hidden = usePlays((s) => s.hidden);
  const library = useLibrary((s) => s.tracks);
  const playlists = usePlaylists((s) => s.playlists);
  return useMemo(() => {
    const now = Date.now();
    const all = new Map<string, ArtistStat>();
    for (const [key, a] of Object.entries(artists)) all.set(key, { ...a, score: decayed(a.score, a.last, now) });
    const seed = (track: Track, at: number) => {
      if (!track.artist.name.trim()) return;
      const key = artistKey(track);
      const prev = all.get(key);
      const score = (prev?.score ?? 0) + decayed(1, at, now);
      all.set(key, prev ? { ...prev, score, coverUrl: prev.coverUrl ?? track.coverUrl } : statFor(track, score, at));
    };
    for (const tr of library) seed(tr, tr.downloadedAt);
    for (const pl of playlists) for (const tr of pl.tracks) seed(tr, pl.updatedAt);
    const skip = new Set(hidden);
    return [...all.entries()]
      .filter(([key]) => !skip.has(key))
      .map(([key, a]) => ({ ...a, key }))
      .sort((a, b) => b.score - a.score || b.last - a.last)
      .slice(0, ARTISTS_SHOWN);
  }, [artists, hidden, library, playlists]);
}

function ArtistPhoto({ page, coverUrl, name }: { page: string | null; coverUrl?: string; name: string }) {
  const artist = useArtist(page ?? '');
  const src = (page ? artist.data?.pictureUrl : undefined) ?? coverUrl;
  return (
    <span
      className="artist-chip__photo"
      style={{ backgroundImage: src ? `url("${imageUrl(src)}")` : placeholderGradient(name) }}
    />
  );
}

function ArtistChip({ a, onHide }: { a: { key: string; page: string | null; name: string; coverUrl?: string; source: Track['source'] }; onHide?: () => void }) {
  const go = useNav((s) => s.go);
  const { t } = useT();
  const open = () => (a.page ? go({ name: 'artist', id: a.page }) : go({ name: 'search', q: a.name }));
  return (
    <span className="mood artist-chip">
      <button
        type="button"
        className="artist-chip__go"
        onClick={open}
        {...(a.page ? onIntent(() => prefetchArtist(a.page!)) : {})}
      >
        <ArtistPhoto page={a.page} coverUrl={a.coverUrl} name={a.name} />
        <span className="ellipsis">{a.name}</span>
      </button>
      {onHide && (
        <button
          type="button"
          className="recent-q__x"
          aria-label={t('search.hideArtist', { name: a.name })}
          title={t('search.hideArtist', { name: a.name })}
          onClick={onHide}
        >
          <X size={15} />
        </button>
      )}
    </span>
  );
}

function YourArtists() {
  const mine = useYourArtists();
  const hide = usePlays((s) => s.hide);
  const chart = useChart();
  const { t } = useT();
  if (mine.length)
    return (
      <section className="section">
        <h2 className="h2">{t('search.yourArtists')}</h2>
        <div className="mood-cloud">
          {mine.map((a) => (
            <ArtistChip key={a.key} a={a} onHide={() => hide(a.key)} />
          ))}
        </div>
      </section>
    );
  const top = chart.data?.artists.slice(0, ARTISTS_SHOWN) ?? [];
  if (!top.length) return null;
  return (
    <section className="section">
      <h2 className="h2">{t('search.popularArtists')}</h2>
      <p className="muted" style={{ margin: 0 }}>
        {t('search.popularHint')}
      </p>
      <div className="mood-cloud">
        {top.map((a) => (
          <ArtistChip
            key={a.id}
            a={{ key: a.id, page: a.id, name: a.name, coverUrl: a.pictureUrl, source: 'deezer' }}
          />
        ))}
      </div>
    </section>
  );
}

const NO_TRACKS: Track[] = [];

export function Search({ q }: { q?: string }) {
  const [tab, setTab] = useState<Tab>('deezer');
  const query = q?.trim() ?? '';
  const link = isLink(query);
  const results = useSearch(!query || link || importSource(query) ? null : query, tab);
  const { t } = useT();
  const list = results.data ?? NO_TRACKS;
  useRememberPlays(query, list);

  if (!query) {
    return (
      <div className="page page-enter">
        <h1 className="h1">{t('search.title')}</h1>
        <p className="muted" style={{ margin: 0, maxWidth: '60ch' }}>
          {t('search.intro')}
        </p>
        <YourArtists />
        <RecentSearches />
        <RecentTracks />
      </div>
    );
  }

  // A playlist link: offer to import it rather than play one track.
  if (importSource(query)) return <ImportScreen url={query} />;

  if (link) return <LinkResult key={query} query={query} />;

  return (
    <div className="page page-enter">
      <div className="section__head">
        <h1 className="h1 ellipsis">{t('search.query', { q: query })}</h1>
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'deezer', label: 'Deezer' },
            { value: 'soundcloud', label: 'SoundCloud' },
          ]}
        />
      </div>
      {results.loading ? (
        <SkeletonRows n={8} />
      ) : results.error ? (
        <div className="empty">
          <strong>{t('search.failed')}</strong>
          {results.error}
        </div>
      ) : list.length === 0 ? (
        <div className="empty">
          <SearchX size={36} />
          <strong>{t('search.nothing')}</strong>
          {tab === 'deezer' ? t('search.tryScTab') : t('search.trySpelling')}
        </div>
      ) : (
        <>
          <div className="search-split">
            <section className="section">
              <h2 className="h2">{t('search.best')}</h2>
              <TopResult track={list[0]} list={list} />
            </section>
            <section className="section" style={{ minWidth: 0 }}>
              <h2 className="h2">{t('search.tracks')}</h2>
              <TrackTable tracks={list.slice(0, 5)} showAlbum={false} compact />
            </section>
          </div>
          {list.length > 5 && (
            <section className="section">
              <h2 className="h2">{t('search.all')}</h2>
              <TrackTable tracks={list} showAlbum={tab === 'deezer'} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
