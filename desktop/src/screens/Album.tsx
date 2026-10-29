import { Download, Play, Shuffle } from 'lucide-react';
import { formatTotal, tracksLabel } from '@/lib/format';
import { onIntent, prefetchArtist, useAlbum } from '@/lib/queries';
import { useLibrary } from '@/store/library';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { AlbumSkeleton, Cover } from '@/components/ui';
import { TrackTable } from '@/components/TrackTable';

export function Album({ id }: { id: string }) {
  const { data, loading, error } = useAlbum(id);
  const playQueue = usePlayer((s) => s.playQueue);
  const downloadMany = useLibrary((s) => s.downloadMany);
  const missing = useLibrary((s) => (data ? data.tracks.filter((t) => !s.tracks.some((l) => l.id === t.id)).length : 0));
  const go = useNav((s) => s.go);

  if (loading) return <AlbumSkeleton />;
  if (error || !data) return <div className="page"><div className="empty"><strong>Альбом не загрузился</strong>{error}</div></div>;

  const total = data.tracks.reduce((s, t) => s + t.durationSec, 0);
  return (
    <div className="page page-enter">
      <header className="detail-head">
        <Cover src={data.coverUrl} seed={data.title} label={data.title} />
        <div className="detail-head__body">
          <h1 className="detail-head__title">{data.title}</h1>
          <div className="detail-head__meta">
            {data.artistId ? (
              <button
                type="button"
                style={{ fontWeight: 500, color: 'var(--text)' }}
                onClick={() => go({ name: 'artist', id: data.artistId })}
                {...onIntent(() => prefetchArtist(data.artistId))}
              >
                {data.artistName}
              </button>
            ) : (
              <span>{data.artistName}</span>
            )}
            {data.year && <span className="dot">Альбом {data.year}</span>}
            <span className="dot">{tracksLabel(data.tracks.length)}</span>
            <span className="dot">{formatTotal(total)}</span>
          </div>
        </div>
      </header>
      <div className="actions">
        <button type="button" className="play-fab" aria-label="Слушать альбом" onClick={() => playQueue(data.tracks, 0)}>
          <Play size={22} fill="currentColor" />
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Перемешать"
          title="Перемешать"
          onClick={() => {
            if (!usePlayer.getState().shuffle) usePlayer.getState().toggleShuffle();
            playQueue(data.tracks, Math.floor(Math.random() * data.tracks.length));
          }}
        >
          <Shuffle size={20} />
        </button>
        <button type="button" className="btn" disabled={missing === 0} onClick={() => downloadMany(data.tracks)}>
          <Download size={16} />
          {missing === 0 ? 'Весь альбом на компьютере' : `Скачать альбом · ${tracksLabel(missing)}`}
        </button>
      </div>
      <TrackTable tracks={data.tracks} showAlbum={false} showCover={false} />
    </div>
  );
}
