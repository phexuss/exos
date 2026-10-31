import { Pause, Play } from 'lucide-react';
import { useT } from '@/i18n';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/store/player';

/**
 * The big round play button of a list. While the playing track is from this
 * list it turns into pause and pauses or resumes instead of starting over.
 */
export function PlayFab({
  tracks,
  label,
  match = tracks,
}: {
  tracks: Track[];
  label: string;
  /** Tracks that count as "this list is playing"; the top search result passes just itself. */
  match?: Track[];
}) {
  const ours = usePlayer((s) => !!s.current && match.some((t) => t.id === s.current?.id));
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'loading');
  const { t } = useT();
  const pause = ours && playing;
  return (
    <button
      type="button"
      className="play-fab"
      aria-label={pause ? t('player.pause') : label}
      title={pause ? t('player.pause') : label}
      disabled={!tracks.length}
      onClick={() => {
        const p = usePlayer.getState();
        if (ours) p.toggle();
        else p.playQueue(tracks, 0);
      }}
    >
      {pause ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
    </button>
  );
}
