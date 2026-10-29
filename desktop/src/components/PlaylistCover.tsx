import { ListMusic } from 'lucide-react';
import type { Playlist } from '@/lib/types';
import { Cover } from './ui';

/** Four different sleeves from the playlist in a square, or one when it has fewer. */
export function PlaylistCover({ playlist, className = '' }: { playlist: Playlist; className?: string }) {
  const seen = new Set<string>();
  const covers = [];
  for (const tr of playlist.tracks) {
    const key = tr.coverUrl ?? tr.album ?? tr.id;
    if (seen.has(key)) continue;
    seen.add(key);
    covers.push(tr);
    if (covers.length === 4) break;
  }
  if (!covers.length) {
    return (
      <div className={`cover pl-cover pl-cover--empty ${className}`}>
        <ListMusic size="38%" />
      </div>
    );
  }
  if (covers.length < 4) {
    const tr = covers[0];
    return <Cover src={tr.coverUrl} seed={tr.album ?? tr.id} label={tr.title} className={className} />;
  }
  return (
    <div className={`cover pl-cover ${className}`}>
      {covers.map((tr) => (
        <Cover key={tr.id} src={tr.coverUrl} seed={tr.album ?? tr.id} label={tr.title} />
      ))}
    </div>
  );
}
