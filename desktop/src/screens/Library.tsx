import { FolderOpen, HardDriveDownload, Play, Search, Shuffle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatTotal, tracksLabel } from '@/lib/format';
import { openFolder } from '@/lib/engine';
import { useEngine } from '@/store/engine';
import { useLibrary } from '@/store/library';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { useSettings } from '@/store/settings';
import { TrackTable } from '@/components/TrackTable';

type Sort = 'recent' | 'title' | 'artist';

export function Library() {
  const tracks = useLibrary((s) => s.tracks);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const playQueue = usePlayer((s) => s.playQueue);
  const go = useNav((s) => s.go);
  const dir = useSettings((s) => s.musicDir) ?? useEngine.getState().status?.musicDir ?? '';

  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const list = needle
      ? tracks.filter((t) => `${t.title} ${t.artist.name} ${t.album ?? ''}`.toLowerCase().includes(needle))
      : [...tracks];
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    else if (sort === 'artist') list.sort((a, b) => a.artist.name.localeCompare(b.artist.name, 'ru'));
    else list.sort((a, b) => b.downloadedAt - a.downloadedAt);
    return list;
  }, [tracks, filter, sort]);

  const total = tracks.reduce((s, t) => s + t.durationSec, 0);

  return (
    <div className="page page-enter">
      <header className="section" style={{ gap: 10 }}>
        <h1 className="h1">На компьютере</h1>
        <div className="stat-row">
          <span>
            <b>{tracksLabel(tracks.length)}</b>
          </span>
          <span>
            <b>{formatTotal(total)}</b> без интернета
          </span>
          <span className="ellipsis" style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}>
            {dir}
          </span>
        </div>
      </header>

      {tracks.length === 0 ? (
        <div className="empty">
          <HardDriveDownload size={40} />
          <strong>Пока пусто</strong>
          Нажми на стрелку возле любого трека: yt-dlp скачает его в папку с музыкой на этом компьютере.
          <button type="button" className="btn primary" style={{ marginTop: 8 }} onClick={() => go({ name: 'search' })}>
            Найти музыку
          </button>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <button type="button" className="play-fab" aria-label="Слушать всё" onClick={() => playQueue(shown, 0)}>
              <Play size={22} fill="currentColor" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Перемешать"
              title="Перемешать"
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
              <input id="library-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Фильтр" />
            </label>
            <select id="library-sort" className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Сортировка">
              <option value="recent">Недавно скачанные</option>
              <option value="title">По названию</option>
              <option value="artist">По артисту</option>
            </select>
            <button type="button" className="btn sm" onClick={() => void openFolder(dir)}>
              <FolderOpen size={15} /> Открыть папку
            </button>
          </div>
          <TrackTable tracks={shown} />
        </>
      )}
    </div>
  );
}
