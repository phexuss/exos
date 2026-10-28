import { ArrowDownToLine, RotateCcw, X } from 'lucide-react';
import { useMemo } from 'react';
import { useLibrary, type DownloadJob } from '@/store/library';
import { Cover } from '@/components/ui';

function stateLabel(j: DownloadJob): string {
  switch (j.stage) {
    case 'queued':
      return 'В очереди';
    case 'resolving':
      return 'yt-dlp ищет источник…';
    case 'downloading':
      return `${Math.round(j.progress * 100)}%${j.speed ? ` · ${j.speed}` : ''}${j.eta ? ` · ещё ${j.eta}` : ''}`;
    case 'converting':
      return 'ffmpeg конвертирует…';
    case 'done':
      return 'Готово';
    case 'error':
      return j.error ?? 'Ошибка';
  }
}

function Job({ job }: { job: DownloadJob }) {
  const cancel = useLibrary((s) => s.cancel);
  const download = useLibrary((s) => s.download);
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
        <button type="button" className="icon-btn sm" aria-label="Повторить" title="Повторить" onClick={() => download(t)}>
          <RotateCcw size={15} />
        </button>
      ) : job.stage === 'done' ? (
        <span />
      ) : (
        <button type="button" className="icon-btn sm" aria-label="Отменить" title="Отменить" onClick={() => cancel(t.id)}>
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

  return (
    <div className="page page-enter">
      <header className="section" style={{ gap: 10 }}>
        <h1 className="h1">Загрузки</h1>
        <p className="muted" style={{ margin: 0, maxWidth: '64ch' }}>
          yt-dlp работает на этом компьютере и качает с твоего IP, сервер EXØS в этом не участвует. Одновременно
          идут две загрузки, остальные ждут.
        </p>
      </header>
      {jobs.length === 0 ? (
        <div className="empty">
          <ArrowDownToLine size={40} />
          <strong>Сейчас ничего не качается</strong>
          Скачанное появится в разделе «На компьютере».
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="section">
              <h2 className="h2">Сейчас · {active.length}</h2>
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
                <h2 className="h2">Готово</h2>
                <button type="button" className="link-btn" onClick={clearFinished}>
                  Очистить список
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
