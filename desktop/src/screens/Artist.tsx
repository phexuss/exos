import { Download, Play } from 'lucide-react';
import { useState } from 'react';
import { formatCount, placeholderGradient, tracksLabel } from '@/lib/format';
import { imageUrl } from '@/lib/bridge';
import { useArtist, useArtistAlbums, useArtistTracks } from '@/lib/queries';
import { useLibrary } from '@/store/library';
import { usePlayer } from '@/store/player';
import { ArtistSkeleton, SkeletonRows } from '@/components/ui';
import { TrackTable } from '@/components/TrackTable';
import { AlbumTile } from './cards';

export function Artist({ id }: { id: string }) {
  const artist = useArtist(id);
  const tracks = useArtistTracks(id);
  const albums = useArtistAlbums(id);
  const [all, setAll] = useState(false);
  const playQueue = usePlayer((s) => s.playQueue);
  const downloadMany = useLibrary((s) => s.downloadMany);
  const top = tracks.data ?? [];

  if (artist.loading) return <ArtistSkeleton />;
  if (!artist.data) return <div className="page"><div className="empty"><strong>Артист не загрузился</strong>{artist.error}</div></div>;
  const a = artist.data;

  return (
    <div className="page page-enter">
      {/* Artists get a wide banner, albums a square sleeve: different pages, different shapes. */}
      <header className="artist-banner">
        <div
          className="artist-banner__photo"
          style={{ backgroundImage: a.pictureUrl ? `url("${imageUrl(a.pictureUrl)}")` : placeholderGradient(a.name) }}
        />
        <div className="artist-banner__body">
          <h1 className="artist-banner__name">{a.name}</h1>
          <div className="detail-head__meta">
            <span>Артист</span>
            {a.fans ? <span className="dot">{formatCount(a.fans)} слушателей на Deezer</span> : null}
            {a.albumsCount ? <span className="dot">{a.albumsCount} релизов</span> : null}
          </div>
        </div>
      </header>
      <div className="actions">
        <button type="button" className="play-fab" aria-label="Слушать популярное" onClick={() => playQueue(top, 0)} disabled={!top.length}>
          <Play size={22} fill="currentColor" />
        </button>
        <button type="button" className="btn" disabled={!top.length} onClick={() => downloadMany(top)}>
          <Download size={16} /> Скачать популярное · {tracksLabel(top.length)}
        </button>
      </div>
      <section className="section">
        <h2 className="h2">Популярное</h2>
        {tracks.loading ? <SkeletonRows /> : <TrackTable tracks={all ? top : top.slice(0, 5)} />}
        {top.length > 5 && (
          <button type="button" className="link-btn" style={{ alignSelf: 'flex-start', paddingLeft: 12 }} onClick={() => setAll(!all)}>
            {all ? 'Свернуть' : `Ещё ${top.length - 5}`}
          </button>
        )}
      </section>
      {(albums.data?.length ?? 0) > 0 && (
        <section className="section">
          <h2 className="h2">Дискография</h2>
          <div className="grid-cards">
            {albums.data!.map((al) => (
              <AlbumTile key={al.id} album={{ ...al, artistName: undefined }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
