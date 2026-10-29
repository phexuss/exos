import { Link2, Play, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useT } from '@/i18n';
import { formatTime } from '@/lib/format';
import { importSource } from '@/lib/importer';
import { useSearch } from '@/lib/queries';
import type { Track } from '@/lib/types';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { Cover, SkeletonRows, SourcePill } from '@/components/ui';
import { Tabs } from '@/components/Tabs';
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
      <button
        type="button"
        className="play-fab"
        aria-label={t('common.playTitle', { title: track.title })}
        onClick={() => playQueue(list, 0)}
      >
        <Play size={22} fill="currentColor" />
      </button>
    </div>
  );
}

export function Search({ q }: { q?: string }) {
  const [tab, setTab] = useState<Tab>('deezer');
  const go = useNav((s) => s.go);
  const query = q?.trim() ?? '';
  const link = isLink(query);
  const results = useSearch(!query || link || importSource(query) ? null : query, tab);
  const { t } = useT();

  if (!query) {
    return (
      <div className="page page-enter">
        <h1 className="h1">{t('search.title')}</h1>
        <p className="muted" style={{ margin: 0, maxWidth: '60ch' }}>
          {t('search.intro')}
        </p>
        <section className="section">
          <h2 className="h2">{t('search.startWith')}</h2>
          <div className="mood-cloud">
            {t('search.moods')
              .split(',')
              .map((name) => (
                <button type="button" key={name} className="mood" onClick={() => go({ name: 'search', q: name })}>
                  {name}
                </button>
              ))}
          </div>
        </section>
      </div>
    );
  }

  // A playlist link: offer to import it rather than play one track.
  if (importSource(query)) return <ImportScreen url={query} />;

  if (link) {
    const lt = linkTrack(query);
    return (
      <div className="page page-enter">
        <h1 className="h1">{t('search.link')}</h1>
        <div className="search-split">
          <TopResult track={lt} list={[lt]} />
          <div className="empty" style={{ alignItems: 'flex-start', textAlign: 'left', padding: 0 }}>
            <Link2 size={28} />
            <strong>{t('search.linkTitle')}</strong>
            {t('search.linkHint')}
          </div>
        </div>
      </div>
    );
  }

  const list = results.data ?? [];
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
