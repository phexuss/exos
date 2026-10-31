import { FolderOpen, HardDriveDownload, Search, Shuffle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useT } from '@/i18n';
import { formatTotal, tracksLabel } from '@/lib/format';
import { openFolder } from '@/lib/engine';
import { useEngine } from '@/store/engine';
import { useLibrary } from '@/store/library';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { useSettings } from '@/store/settings';
import { Select } from '@/components/Select';
import { PlayFab } from '@/components/PlayFab';
import { TrackTable } from '@/components/TrackTable';

type Sort = 'recent' | 'title' | 'artist';

export function Library() {
  const tracks = useLibrary((s) => s.tracks);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const playQueue = usePlayer((s) => s.playQueue);
  const go = useNav((s) => s.go);
  const dir = useSettings((s) => s.musicDir) ?? useEngine.getState().status?.musicDir ?? '';
  const { t, locale } = useT();

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const list = needle
      ? tracks.filter((t) => `${t.title} ${t.artist.name} ${t.album ?? ''}`.toLowerCase().includes(needle))
      : [...tracks];
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, locale));
    else if (sort === 'artist') list.sort((a, b) => a.artist.name.localeCompare(b.artist.name, locale));
    else list.sort((a, b) => b.downloadedAt - a.downloadedAt);
    return list;
  }, [tracks, filter, sort, locale]);

  const total = tracks.reduce((s, t) => s + t.durationSec, 0);

  return (
    <div className="page page-enter">
      <header className="section" style={{ gap: 10 }}>
        <h1 className="h1">{t('library.title')}</h1>
        <div className="stat-row">
          <span>
            <b>{tracksLabel(tracks.length)}</b>
          </span>
          <span>{t('library.offline', { total: formatTotal(total) })}</span>
          <span className="ellipsis" style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}>
            {dir}
          </span>
        </div>
      </header>

      {tracks.length === 0 ? (
        <div className="empty">
          <HardDriveDownload size={40} />
          <strong>{t('library.emptyTitle')}</strong>
          {t('library.emptyHint')}
          <button type="button" className="btn primary" style={{ marginTop: 8 }} onClick={() => go({ name: 'search' })}>
            {t('library.find')}
          </button>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <PlayFab tracks={shown} label={t('library.playAll')} />
            <button
              type="button"
              className="icon-btn"
              aria-label={t('common.shuffle')}
              title={t('common.shuffle')}
              onClick={() => {
                if (!usePlayer.getState().shuffle) usePlayer.getState().toggleShuffle();
                playQueue(shown, Math.floor(Math.random() * shown.length));
              }}
            >
              <Shuffle size={20} />
            </button>
            <span className="toolbar__spacer" />
            <label className="searchbox">
              <Search size={15} />
              <input
                id="library-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t('library.filter')}
              />
            </label>
            <Select
              id="library-sort"
              value={sort}
              onChange={setSort}
              label={t('library.sort')}
              options={[
                { value: 'recent', label: t('library.recent') },
                { value: 'title', label: t('library.byTitle') },
                { value: 'artist', label: t('library.byArtist') },
              ]}
            />
            <button type="button" className="btn sm" onClick={() => void openFolder(dir)}>
              <FolderOpen size={15} /> {t('library.openFolder')}
            </button>
          </div>
          <TrackTable tracks={shown} />
        </>
      )}
    </div>
  );
}
