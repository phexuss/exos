import { Download, Shuffle, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PlaylistCover } from '@/components/PlaylistCover';
import { PlayFab } from '@/components/PlayFab';
import { TrackTable } from '@/components/TrackTable';
import { useT } from '@/i18n';
import { formatTotal, tracksLabel } from '@/lib/format';
import { useLibrary } from '@/store/library';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { usePlaylists } from '@/store/playlists';
import { toast } from '@/store/toast';

/** Name that turns into a field on click; a fresh playlist opens with it focused. */
function EditableName({ id, name, autoEdit }: { id: string; name: string; autoEdit: boolean }) {
  const rename = usePlaylists((s) => s.rename);
  const { t } = useT();
  const [editing, setEditing] = useState(autoEdit);
  const [draft, setDraft] = useState(name);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);
  if (!editing) {
    return (
      <h1 className="detail-head__title pl-name" title={t('playlist.rename')}>
        <button type="button" onClick={() => (setDraft(name), setEditing(true))}>
          {name}
        </button>
      </h1>
    );
  }
  const done = () => {
    rename(id, draft);
    setEditing(false);
  };
  return (
    <input
      ref={input}
      className="detail-head__title pl-name__input"
      value={draft}
      maxLength={100}
      aria-label={t('playlist.rename')}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={done}
      onKeyDown={(e) => {
        if (e.key === 'Enter') done();
        if (e.key === 'Escape') {
          setDraft(name);
          setEditing(false);
        }
      }}
    />
  );
}

export function PlaylistScreen({ id }: { id: string }) {
  const playlist = usePlaylists((s) => s.playlists.find((p) => p.id === id));
  const loaded = usePlaylists((s) => s.loaded);
  const remove = usePlaylists((s) => s.remove);
  const removeAt = usePlaylists((s) => s.removeAt);
  const playQueue = usePlayer((s) => s.playQueue);
  const downloadMany = useLibrary((s) => s.downloadMany);
  const missing = useLibrary((s) =>
    playlist ? playlist.tracks.filter((tr) => !s.tracks.some((l) => l.id === tr.id)).length : 0,
  );
  const go = useNav((s) => s.go);
  const { t } = useT();
  const [confirm, setConfirm] = useState(false);
  const [fresh] = useState(() => {
    const isNew = usePlaylists.getState().justCreated === id;
    if (isNew) usePlaylists.setState({ justCreated: null });
    return isNew;
  });

  useEffect(() => {
    if (!confirm) return;
    const timer = setTimeout(() => setConfirm(false), 3000);
    return () => clearTimeout(timer);
  }, [confirm]);

  if (!playlist) return loaded ? <div className="page"><div className="empty"><strong>{t('playlist.none')}</strong></div></div> : null;
  const tracks = playlist.tracks;
  const total = tracks.reduce((s, tr) => s + tr.durationSec, 0);

  return (
    <div className="page page-enter">
      <header className="detail-head">
        <PlaylistCover playlist={playlist} />
        <div className="detail-head__body">
          <span className="eyebrow">{t('playlist.title')}</span>
          <EditableName key={playlist.id} id={playlist.id} name={playlist.name} autoEdit={fresh} />
          <div className="detail-head__meta">
            <span>{tracksLabel(tracks.length)}</span>
            {total > 0 && <span className="dot">{formatTotal(total)}</span>}
          </div>
        </div>
      </header>
      <div className="actions">
        <PlayFab tracks={tracks} label={t('playlist.play')} />
        <button
          type="button"
          className="icon-btn"
          aria-label={t('common.shuffle')}
          title={t('common.shuffle')}
          disabled={!tracks.length}
          onClick={() => {
            if (!usePlayer.getState().shuffle) usePlayer.getState().toggleShuffle();
            playQueue(tracks, Math.floor(Math.random() * tracks.length));
          }}
        >
          <Shuffle size={20} />
        </button>
        {tracks.length > 0 && (
          <button type="button" className="btn" disabled={missing === 0} onClick={() => downloadMany(tracks)}>
            <Download size={16} />
            {missing === 0 ? t('playlist.allLocal') : t('playlist.download', { tracks: tracksLabel(missing) })}
          </button>
        )}
        <span className="toolbar__spacer" />
        <button
          type="button"
          className={`btn sm ${confirm ? 'danger' : ''}`}
          onClick={() => {
            if (!confirm) return setConfirm(true);
            remove(playlist.id);
            toast(t('playlist.removed', { name: playlist.name }));
            go({ name: 'library' });
          }}
        >
          <Trash2 size={15} /> {confirm ? t('playlist.confirmRemove') : t('playlist.remove')}
        </button>
      </div>
      {tracks.length ? (
        <TrackTable tracks={tracks} playlistId={playlist.id} onRemove={(i) => removeAt(playlist.id, i)} />
      ) : (
        <div className="empty">
          <strong>{t('playlist.emptyTitle')}</strong>
          {t('playlist.emptyHint')}
          <button type="button" className="btn primary" style={{ marginTop: 8 }} onClick={() => go({ name: 'search' })}>
            {t('playlist.findMusic')}
          </button>
        </div>
      )}
    </div>
  );
}
