import { ListPlus } from 'lucide-react';
import { useState } from 'react';
import { useT } from '@/i18n';
import { tracksLabel } from '@/lib/format';
import { type ImportProgress, importPlaylist, importSource } from '@/lib/importer';
import { useNav } from '@/store/nav';
import { usePlaylists } from '@/store/playlists';
import { toast } from '@/store/toast';

/** Paste a SoundCloud or Spotify link, get the same playlist on this computer. */
export function ImportScreen({ url: initial = '' }: { url?: string }) {
  const { t } = useT();
  const go = useNav((s) => s.go);
  const create = usePlaylists((s) => s.create);
  const [url, setUrl] = useState(initial);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = progress !== null;

  const run = async () => {
    if (busy) return;
    if (!importSource(url)) {
      setError(t('importer.badLink'));
      return;
    }
    setError(null);
    try {
      const result = await importPlaylist(url, setProgress);
      const id = create(result.tracks, result.name);
      toast(t('importer.done', { name: result.name, tracks: tracksLabel(result.tracks.length) }));
      if (result.unmatched) toast(t('importer.unmatched', { n: result.unmatched }));
      if (result.truncated) toast(t('importer.truncated', { n: result.tracks.length }));
      if (result.lost) toast(t('importer.lost', { n: result.lost }));
      go({ name: 'playlist', id });
    } catch (e) {
      setError(t('importer.failed', { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setProgress(null);
    }
  };

  const status =
    progress?.stage === 'reading'
      ? t('importer.reading')
      : progress?.stage === 'loading'
        ? t('importer.loading', { done: progress.done, total: progress.total })
        : progress?.stage === 'matching'
          ? t('importer.matching', { done: progress.done, total: progress.total })
          : null;
  const counted = progress && progress.stage !== 'reading' ? progress : null;

  return (
    <div className="page page-enter">
      <div className="section">
        <h1 className="h1">{t('importer.title')}</h1>
        <p className="muted import__intro">{t('importer.intro')}</p>
      </div>
      <form
        className="import__form"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <div className="field">
          <label htmlFor="import-url">{t('importer.link')}</label>
          <div className="import__row">
            <input
              id="import-url"
              value={url}
              placeholder={t('importer.placeholder')}
              spellCheck={false}
              autoFocus={!initial}
              disabled={busy}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
            />
            <button type="submit" className="btn primary" disabled={busy || !url.trim()}>
              <ListPlus size={18} />
              {t('importer.submit')}
            </button>
          </div>
        </div>
        {busy && (
          <div className="import__progress" aria-live="polite">
            <div className={`bar ${counted ? '' : 'indet'}`}>
              <i style={{ width: counted ? `${(counted.done / counted.total) * 100}%` : undefined }} />
            </div>
            <span className="muted tabular">{status}</span>
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
      </form>
      <dl className="import__sources">
        <div>
          <dt>SoundCloud</dt>
          <dd className="muted">{t('importer.scHint')}</dd>
        </div>
        <div>
          <dt>Spotify</dt>
          <dd className="muted">{t('importer.spHint')}</dd>
        </div>
      </dl>
    </div>
  );
}
