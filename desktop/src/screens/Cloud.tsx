import { Cloud as CloudIcon, CloudCheck, Download, RotateCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useT } from '@/i18n';
import { tracksLabel } from '@/lib/format';
import { missingHere, useCloud } from '@/store/cloud';
import { useLibrary } from '@/store/library';
import { Tabs } from '@/components/Tabs';
import { PlayFab } from '@/components/PlayFab';
import { TrackTable } from '@/components/TrackTable';
import { SkeletonRows } from '@/components/ui';

type Show = 'missing' | 'all';

export function Cloud() {
  const items = useCloud((s) => s.items);
  const status = useCloud((s) => s.status);
  const error = useCloud((s) => s.error);
  const local = useLibrary((s) => s.tracks);
  const downloadMany = useLibrary((s) => s.downloadMany);
  const [show, setShow] = useState<Show>('missing');
  const { t } = useT();

  const all = useMemo(() => items.map((i) => i.track), [items]);
  const missing = useMemo(() => missingHere(items, local), [items, local]);
  const shown = show === 'missing' ? missing : all;
  const refresh = () => void useCloud.getState().sync(useLibrary.getState().tracks);

  return (
    <div className="page page-enter">
      <header className="section" style={{ gap: 10 }}>
        <h1 className="h1">{t('cloud.title')}</h1>
        <p className="muted" style={{ margin: 0, maxWidth: '64ch' }}>
          {t('cloud.intro')}
        </p>
        {items.length > 0 && (
          <div className="stat-row">
            <span>
              <b>{tracksLabel(items.length)}</b>
            </span>
            <span>{missing.length ? t('cloud.notHere', { tracks: tracksLabel(missing.length) }) : t('cloud.allHere')}</span>
          </div>
        )}
      </header>

      {status === 'error' && items.length === 0 ? (
        <div className="empty">
          <CloudIcon size={40} />
          <strong>{t('cloud.failed')}</strong>
          {error}
          <button type="button" className="btn" style={{ marginTop: 8 }} onClick={refresh}>
            <RotateCw size={16} />
            {t('common.retry')}
          </button>
        </div>
      ) : items.length === 0 && status !== 'ready' ? (
        <SkeletonRows />
      ) : items.length === 0 ? (
        <div className="empty">
          <CloudIcon size={40} />
          <strong>{t('cloud.emptyTitle')}</strong>
          {t('cloud.emptyHint')}
        </div>
      ) : (
        <>
          <div className="toolbar">
            <PlayFab tracks={shown} label={t('cloud.play')} />
            <button type="button" className="btn" disabled={missing.length === 0} onClick={() => downloadMany(missing)}>
              <Download size={16} />
              {missing.length === 0 ? t('cloud.allHere') : t('cloud.downloadMissing', { tracks: tracksLabel(missing.length) })}
            </button>
            <span className="toolbar__spacer" />
            <Tabs<Show>
              value={show}
              onChange={setShow}
              options={[
                { value: 'missing', label: t('cloud.showMissing') },
                { value: 'all', label: t('cloud.showAll') },
              ]}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label={t('cloud.refresh')}
              title={t('cloud.refresh')}
              disabled={status === 'loading'}
              onClick={refresh}
            >
              <RotateCw size={18} className={status === 'loading' ? 'spin-icon' : undefined} />
            </button>
          </div>
          {shown.length === 0 ? (
            <div className="empty">
              <CloudCheck size={40} />
              <strong>{t('cloud.allHereTitle')}</strong>
              {t('cloud.allHereHint')}
            </div>
          ) : (
            <TrackTable tracks={shown} />
          )}
        </>
      )}
    </div>
  );
}
