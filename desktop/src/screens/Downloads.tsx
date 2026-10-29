import { ArrowDownToLine, RotateCcw, X } from 'lucide-react';
import { useMemo } from 'react';
import { t, useT } from '@/i18n';
import { useLibrary, type DownloadJob } from '@/store/library';
import { Cover } from '@/components/ui';

function stateLabel(j: DownloadJob): string {
  switch (j.stage) {
    case 'queued':
      return t('download.queued');
    case 'resolving':
      return t('download.resolving');
    case 'downloading':
      return `${Math.round(j.progress * 100)}%${j.speed ? ` · ${j.speed}` : ''}${j.eta ? ` · ${t('download.left', { eta: j.eta })}` : ''}`;
    case 'converting':
      return t('download.converting');
    case 'done':
      return t('download.finished');
    case 'error':
      return j.error ?? t('download.error');
  }
}

function Job({ job }: { job: DownloadJob }) {
  const cancel = useLibrary((s) => s.cancel);
  const download = useLibrary((s) => s.download);
  const { t: tr } = useT();
  const t = job.track;
  const indet = job.stage === 'queued' || job.stage === 'resolving' || job.stage === 'converting';
  return (
    <div className="job">
      <Cover src={t.coverUrl} seed={t.album ?? t.id} label={t.title} />
      <div style={{ minWidth: 0 }}>
        <div className="q-title ellipsis">{t.title}</div>
        <div className="q-sub ellipsis">{t.artist.name}</div>
      </div>
      <div className={`bar ${indet ? 'indet' : ''}`} style={{ opacity: job.stage === 'done' ? 0.35 : 1 }}>
        <i style={{ width: `${Math.round((job.stage === 'done' ? 1 : job.progress) * 100)}%` }} />
      </div>
      <div className={`job__state ellipsis ${job.stage === 'error' ? 'err' : job.stage === 'done' ? 'ok' : ''}`} title={stateLabel(job)}>
        {stateLabel(job)}
      </div>
      {job.stage === 'error' ? (
        <button
          type="button"
          className="icon-btn sm"
          aria-label={tr('common.retry')}
          title={tr('common.retry')}
          onClick={() => download(t)}
        >
          <RotateCcw size={15} />
        </button>
      ) : job.stage === 'done' ? (
        <span />
      ) : (
        <button
          type="button"
          className="icon-btn sm"
          aria-label={tr('common.cancel')}
          title={tr('common.cancel')}
          onClick={() => cancel(t.id)}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function Downloads() {
  // Select the stable map, not a fresh array: zustand 5 re-renders forever on a new reference.
  const jobMap = useLibrary((s) => s.jobs);
  const jobs = useMemo(() => Object.values(jobMap).sort((a, b) => b.startedAt - a.startedAt), [jobMap]);
  const clearFinished = useLibrary((s) => s.clearFinished);
  const active = jobs.filter((j) => j.stage !== 'done' && j.stage !== 'error');
  const finished = jobs.filter((j) => j.stage === 'done' || j.stage === 'error');
  const { t } = useT();

  return (
    <div className="page page-enter">
      <header className="section" style={{ gap: 10 }}>
        <h1 className="h1">{t('downloads.title')}</h1>
        <p className="muted" style={{ margin: 0, maxWidth: '64ch' }}>
          {t('downloads.intro')}
        </p>
      </header>
      {jobs.length === 0 ? (
        <div className="empty">
          <ArrowDownToLine size={40} />
          <strong>{t('downloads.emptyTitle')}</strong>
          {t('downloads.emptyHint')}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="section">
              <h2 className="h2">{t('downloads.now', { n: active.length })}</h2>
              <div>
                {active.map((j) => (
                  <Job key={j.track.id} job={j} />
                ))}
              </div>
            </section>
          )}
          {finished.length > 0 && (
            <section className="section">
              <div className="section__head">
                <h2 className="h2">{t('downloads.done')}</h2>
                <button type="button" className="link-btn" onClick={clearFinished}>
                  {t('downloads.clear')}
                </button>
              </div>
              <div>
                {finished.map((j) => (
                  <Job key={j.track.id} job={j} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
