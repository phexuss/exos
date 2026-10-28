import { X } from 'lucide-react';
import { formatTime } from '@/lib/format';
import { usePlayer } from '@/store/player';
import { Lyrics } from './Lyrics';
import { Cover, Eq } from './ui';

function Queue() {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const playing = usePlayer((s) => s.status === 'playing');
  const p = usePlayer.getState();
  if (!queue.length) return <div className="empty">Очередь пустая.</div>;
  const upNext = queue.slice(index + 1);
  const item = (t: (typeof queue)[number], i: number) => (
    <div
      key={`${t.id}-${i}`}
      className={`queue-item ${i === index ? 'is-current' : ''}`}
      onDoubleClick={() => p.playQueue(queue, i)}
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
        <button type="button" className="icon-btn sm" aria-label="Убрать из очереди" onClick={() => p.removeFromQueue(i)}>
          <X size={15} />
        </button>
      )}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div className="eyebrow" style={{ padding: '8px 8px 4px' }}>
        Сейчас
      </div>
      {item(queue[index], index)}
      {upNext.length > 0 && (
        <div className="eyebrow" style={{ padding: '16px 8px 4px' }}>
          Дальше · {upNext.length}
        </div>
      )}
      {upNext.map((t, j) => item(t, index + 1 + j))}
    </div>
  );
}

export function SidePanel() {
  const panel = usePlayer((s) => s.panel);
  const setPanel = usePlayer((s) => s.setPanel);
  if (!panel) return null;
  return (
    <aside className="panel slab">
      <div className="panel__head">
        <div className="tabs">
          <button type="button" className={panel === 'lyrics' ? 'is-active' : ''} onClick={() => setPanel('lyrics')}>
            Текст
          </button>
          <button type="button" className={panel === 'queue' ? 'is-active' : ''} onClick={() => setPanel('queue')}>
            Очередь
          </button>
        </div>
        <span style={{ flex: 1 }} />
        <button type="button" className="icon-btn sm" aria-label="Закрыть панель" onClick={() => setPanel(null)}>
          <X size={16} />
        </button>
      </div>
      <div className="panel__body">{panel === 'lyrics' ? <Lyrics /> : <Queue />}</div>
    </aside>
  );
}
