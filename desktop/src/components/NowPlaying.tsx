import { ChevronDown } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useT } from '@/i18n';
import { outEasing, reducedMotion, springEasing } from '@/lib/motion';
import { registerNowPlayingCloser, usePlayer } from '@/store/player';
import { useSettings, type VizStyle } from '@/store/settings';
import { AmbientArt } from './Ambient';
import { Lyrics } from './Lyrics';
import { Tabs } from './Tabs';
import { Cover, SourcePill } from './ui';
import { useVizOn, Visualizer } from './Visualizer';

/** Transform that puts `el` exactly over the player bar's cover. */
function towardsBar(el: HTMLElement): string | null {
  const bar = document.querySelector('.player__now .cover')?.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (!bar || !r.width) return null;
  const s = bar.width / r.width;
  return `translate(${bar.left - r.left}px, ${bar.top - r.top}px) scale(${s})`;
}

export function NowPlaying() {
  const open = usePlayer((s) => s.nowPlayingOpen);
  const current = usePlayer((s) => s.current);
  const paused = usePlayer((s) => s.status !== 'playing');
  const root = useRef<HTMLElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const close = () => usePlayer.getState().setNowPlaying(false);
  const { t } = useT();
  const viz = useVizOn();
  const vizStyle = useSettings((s) => s.vizStyle);
  const setSettings = useSettings((s) => s.set);

  // The cover grows out of the player bar and goes back into it.
  useLayoutEffect(() => {
    if (!open || !art.current || !root.current || reducedMotion()) return;
    const from = towardsBar(art.current);
    root.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: outEasing });
    if (from) {
      art.current.animate([{ transform: from, borderRadius: '10px' }, { transform: 'none' }], {
        duration: 720,
        easing: springEasing,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    registerNowPlayingCloser(async () => {
      const el = art.current;
      const shell = root.current;
      if (!el || !shell || reducedMotion()) return;
      const to = towardsBar(el);
      const fade = shell.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 120, easing: outEasing, fill: 'forwards' });
      if (to) el.animate([{ transform: 'none' }, { transform: to }], { duration: 420, easing: outEasing, fill: 'forwards' });
      await fade.finished.catch(() => {});
    });
    return () => registerNowPlayingCloser(null);
  }, [open]);

  if (!open || !current) return null;
  return (
    <section className={`np ${viz ? 'has-viz' : ''}`} aria-label={t('player.nowPlaying')} ref={root}>
      <div className="np__bg">
        <AmbientArt />
        <div className="ambient__veil" />
      </div>
      <button
        type="button"
        className="icon-btn np__close"
        onClick={close}
        aria-label={t('player.collapse')}
        title={t('player.collapse')}
      >
        <ChevronDown size={22} />
      </button>
      <div className="np__art">
        <div
          className={`np__tilt ${paused ? 'is-paused' : ''}`}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            e.currentTarget.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`);
            e.currentTarget.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
            e.currentTarget.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
            e.currentTarget.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.setProperty('--rx', '0deg');
            e.currentTarget.style.setProperty('--ry', '0deg');
          }}
        >
          <div ref={art} className="np__cover">
            <Cover key={current.id} src={current.coverUrl} seed={current.album ?? current.id} label={current.title} />
            <span className="np__shine" aria-hidden />
          </div>
        </div>
        <div key={current.id} className="np__meta" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="np__title">{current.title}</div>
          <div className="np__artist" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SourcePill source={current.source} />
            {current.artist.name}
            {current.album ? <span className="muted">· {current.album}</span> : null}
          </div>
        </div>
        {viz && (
          <div className="np__viz">
            <Visualizer kind={vizStyle} />
            <Tabs<VizStyle>
              value={vizStyle}
              onChange={(v) => setSettings({ vizStyle: v })}
              options={[
                { value: 'bars', label: t('player.vizBars') },
                { value: 'wave', label: t('player.vizWave') },
                { value: 'vu', label: t('player.vizVu') },
              ]}
            />
          </div>
        )}
      </div>
      <div className="np__lyrics">
        <Lyrics big />
      </div>
    </section>
  );
}
