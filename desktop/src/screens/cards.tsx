import { Play } from 'lucide-react';
import { useT } from '@/i18n';
import { formatCount } from '@/lib/format';
import type { AlbumCard as Album, ArtistCard as Artist, Track } from '@/lib/types';
import { onIntent, prefetchAlbum, prefetchArtist } from '@/lib/queries';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { Cover, SourcePill } from '@/components/ui';
import { useMenu } from '@/components/ContextMenu';

export function TrackCard({ track, list, i }: { track: Track; list: Track[]; i: number }) {
  const playing = usePlayer((s) => s.current?.id === track.id);
  const playQueue = usePlayer((s) => s.playQueue);
  const showMenu = useMenu((s) => s.show);
  const { t } = useT();
  return (
    <div
      className={`card ${playing ? 'is-playing' : ''}`}
      onDoubleClick={() => playQueue(list, i)}
      onContextMenu={(e) => {
        e.preventDefault();
        showMenu(e.clientX, e.clientY, track, () => playQueue(list, i));
      }}
    >
      <div className="card__art">
        <Cover src={track.coverUrl} seed={track.album ?? track.id} label={track.title} />
        <button
          type="button"
          className="card__play"
          aria-label={t('common.playTitle', { title: track.title })}
          onClick={() => playQueue(list, i)}
        >
          <Play size={18} fill="currentColor" />
        </button>
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="card__title ellipsis">{track.title}</div>
        <div className="card__sub">
          <span className="ellipsis">{track.artist.name}</span>
          <SourcePill source={track.source} />
        </div>
      </div>
    </div>
  );
}

export function AlbumTile({ album }: { album: Album }) {
  const go = useNav((s) => s.go);
  const { t } = useT();
  return (
    <button type="button" className="card" onClick={() => go({ name: 'album', id: album.id })} {...onIntent(() => prefetchAlbum(album.id))}>
      <div className="card__art">
        <Cover src={album.coverUrl} seed={album.title} label={album.title} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="card__title ellipsis">{album.title}</div>
        <div className="card__sub ellipsis">
          {[album.year, album.artistName].filter(Boolean).join(' · ') || t('common.album')}
        </div>
      </div>
    </button>
  );
}

export function ArtistTile({ artist }: { artist: Artist & { fans?: number } }) {
  const go = useNav((s) => s.go);
  const { t } = useT();
  return (
    <button
      type="button"
      className="card artist-card"
      onClick={() => go({ name: 'artist', id: artist.id })}
      {...onIntent(() => prefetchArtist(artist.id))}
    >
      <Cover src={artist.pictureUrl} seed={artist.name} label={artist.name} round style={{ width: '100%' }} />
      <div style={{ minWidth: 0, width: '100%' }}>
        <div className="card__title ellipsis">{artist.name}</div>
        <div className="card__sub">
          {artist.fans ? t('artist.listeners', { n: formatCount(artist.fans) }) : t('common.artist')}
        </div>
      </div>
    </button>
  );
}
