import { ChevronDown } from 'lucide-react';
import { usePlayer } from '@/store/player';
import { Lyrics } from './Lyrics';
import { Cover, SourcePill } from './ui';

export function NowPlaying() {
  const open = usePlayer((s) => s.nowPlayingOpen);
  const current = usePlayer((s) => s.current);
  const close = () => usePlayer.getState().setNowPlaying(false);
  if (!open || !current) return null;
  return (
    <section className="np" aria-label="Сейчас играет">
      <div className="np__bg" />
      <button type="button" className="icon-btn np__close" onClick={close} aria-label="Свернуть (Esc)" title="Свернуть (Esc)">
        <ChevronDown size={22} />
      </button>
      <div className="np__art">
        <Cover src={current.coverUrl} seed={current.album ?? current.id} label={current.title} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="np__title">{current.title}</div>
          <div className="np__artist" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SourcePill source={current.source} />
            {current.artist.name}
            {current.album ? <span className="muted">· {current.album}</span> : null}
          </div>
        </div>
      </div>
      <div className="np__lyrics">
        <Lyrics big />
      </div>
    </section>
  );
}
