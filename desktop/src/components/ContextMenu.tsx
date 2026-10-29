import { Disc3, Download, FolderOpen, ListEnd, ListPlus, Mic2, Play, Trash2, User } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { useT } from '@/i18n';
import { revealInFolder } from '@/lib/engine';
import type { Track } from '@/lib/types';
import { useLibrary } from '@/store/library';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';

type MenuState = {
  open: { x: number; y: number; track: Track; onPlay?: () => void } | null;
  show: (x: number, y: number, track: Track, onPlay?: () => void) => void;
  close: () => void;
};

export const useMenu = create<MenuState>((set) => ({
  open: null,
  show: (x, y, track, onPlay) => set({ open: { x, y, track, onPlay } }),
  close: () => set({ open: null }),
}));

export function ContextMenu() {
  const open = useMenu((s) => s.open);
  const close = useMenu((s) => s.close);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const { t } = useT();
  const local = useLibrary((s) => (open ? s.tracks.find((t) => t.id === open.track.id) : undefined));

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setPos({
      x: Math.min(open.x, window.innerWidth - width - 8),
      y: Math.min(open.y, window.innerHeight - height - 8),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', close);
    };
  }, [open, close]);

  if (!open) return null;
  const { track } = open;
  const act = (fn: () => void) => () => {
    fn();
    close();
  };
  const p = usePlayer.getState();
  const nav = useNav.getState();
  const lib = useLibrary.getState();

  return (
    <div ref={ref} className="menu" style={{ left: pos.x, top: pos.y }} role="menu">
      <button type="button" onClick={act(open.onPlay ?? (() => p.playTrack(track)))}>
        <Play size={16} /> {t('common.play')}
      </button>
      <button type="button" onClick={act(() => p.playNext(track))}>
        <ListPlus size={16} /> {t('menu.playNext')}
      </button>
      <button type="button" onClick={act(() => p.addToQueue(track))}>
        <ListEnd size={16} /> {t('menu.addToQueue')}
      </button>
      <hr />
      {track.source === 'deezer' && track.artist.id && (
        <button type="button" onClick={act(() => nav.go({ name: 'artist', id: track.artist.id }))}>
          <User size={16} /> {t('menu.openArtist')}
        </button>
      )}
      {track.albumId && (
        <button type="button" onClick={act(() => nav.go({ name: 'album', id: track.albumId! }))}>
          <Disc3 size={16} /> {t('menu.openAlbum')}
        </button>
      )}
      <button
        type="button"
        onClick={act(() => {
          p.playTrack(track);
          p.setPanel('lyrics');
        })}
      >
        <Mic2 size={16} /> {t('menu.lyrics')}
      </button>
      <hr />
      {local ? (
        <>
          <button type="button" onClick={act(() => void revealInFolder(local.filePath))}>
            <FolderOpen size={16} /> {t('menu.showInFolder')}
          </button>
          <button type="button" className="danger" onClick={act(() => void lib.remove(track.id))}>
            <Trash2 size={16} /> {t('menu.deleteLocal')}
          </button>
        </>
      ) : (
        <button type="button" onClick={act(() => lib.download(track))}>
          <Download size={16} /> {t('menu.download')}
        </button>
      )}
    </div>
  );
}
