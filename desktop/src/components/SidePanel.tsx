import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useT } from '@/i18n';
import { glide } from '@/lib/springs';
import type { Track } from '@/lib/types';
import { formatTime } from '@/lib/format';
import { usePlayer } from '@/store/player';
import { Lyrics } from './Lyrics';
import { Tabs } from './Tabs';
import { Cover, Eq } from './ui';

/** Keys that survive removals: the track id plus which repeat of it this is. */
function stableKeys(queue: Track[]): string[] {
  const seen = new Map<string, number>();
  return queue.map((t) => {
    const n = seen.get(t.id) ?? 0;
    seen.set(t.id, n + 1);
    return `${t.id}#${n}`;
  });
}

function Queue() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const playing = usePlayer((s) => s.status === 'playing');
  const p = usePlayer.getState();
  const { t: tr } = useT();
  if (!queue.length) return <div className="empty">{tr('queue.empty')}</div>;
  const keys = stableKeys(queue);
  const upNext = queue.slice(index + 1);
  // Removing or reordering slides the rest into place instead of jumping.
  const item = (t: Track, i: number) => (
    <motion.div
      layout="position"
      key={keys[i]}
      transition={glide}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.16 } }}
      className={`queue-item ${i === index ? 'is-current' : ''}`}
      onDoubleClick={() => p.playAt(i)}
    >
      <Cover src={t.coverUrl} seed={t.album ?? t.id} label={t.title} />
      <div style={{ minWidth: 0 }}>
        <div className="q-title ellipsis">{t.title}</div>
        <div className="q-sub ellipsis">
          {t.artist.name} · {formatTime(t.durationSec)}
        </div>
      </div>
      {i === index ? (
        <Eq paused={!playing} />
      ) : (
        <button
          type="button"
          className="icon-btn sm"
          aria-label={tr('queue.remove')}
          onClick={() => p.removeFromQueue(i)}
        >
          <X size={15} />
        </button>
      )}
    </motion.div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="eyebrow" style={{ padding: '8px 8px 4px' }}>
        {tr('queue.now')}
      </div>
      <AnimatePresence initial={false} mode="popLayout">
        {item(queue[index], index)}
      </AnimatePresence>
      {upNext.length > 0 && (
        <div className="eyebrow" style={{ padding: '16px 8px 4px' }}>
          {tr('queue.upNext', { n: upNext.length })}
        </div>
      )}
      <AnimatePresence initial={false} mode="popLayout">
        {upNext.slice(0, 200).map((t, j) => item(t, index + 1 + j))}
      </AnimatePresence>
    </div>
  );
}

export function SidePanel() {
  const panel = usePlayer((s) => s.panel);
  const setPanel = usePlayer((s) => s.setPanel);
  const { t } = useT();
  if (!panel) return null;
  return (
    <aside className="panel slab">
      <div className="panel__head">
        <Tabs
          value={panel}
          onChange={setPanel}
          options={[
            { value: 'lyrics', label: t('player.lyrics') },
            { value: 'queue', label: t('player.queue') },
          ]}
        />
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="icon-btn sm"
          aria-label={t('player.closePanel')}
          onClick={() => setPanel(null)}
        >
          <X size={16} />
        </button>
      </div>
      <div className="panel__body">{panel === 'lyrics' ? <Lyrics /> : <Queue />}</div>
    </aside>
  );
}
