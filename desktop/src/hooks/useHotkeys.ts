import { useEffect } from 'react';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { useSettings } from '@/store/settings';

function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

/**
 * Space play/pause · ←/→ seek 5 s · Shift+←/→ prev/next · ↑/↓ volume ·
 * Ctrl+K or / search · L lyrics · Q queue · F full-window player ·
 * Alt+←/→ back/forward · Esc closes the full-window player.
 */
export function useHotkeys(focusSearch: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = usePlayer.getState();
      const nav = useNav.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft') return nav.back();
      if (e.altKey && e.key === 'ArrowRight') return nav.forward();
      if (isTyping(e)) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      switch (e.key) {
        case ' ':
          e.preventDefault();
          p.toggle();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) p.next();
          else p.seek(p.time + 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) p.prev();
          else p.seek(p.time - 5);
          break;
        case 'ArrowUp':
        case 'ArrowDown': {
          e.preventDefault();
          const v = useSettings.getState().volume + (e.key === 'ArrowUp' ? 0.05 : -0.05);
          p.setVolume(Math.max(0, Math.min(1, v)));
          break;
        }
        case '/':
          e.preventDefault();
          focusSearch();
          break;
        case 'l':
        case 'L':
        case 'д':
          p.togglePanel('lyrics');
          break;
        case 'q':
        case 'Q':
        case 'й':
          p.togglePanel('queue');
          break;
        case 'f':
        case 'F':
        case 'а':
          if (p.current) p.setNowPlaying(!p.nowPlayingOpen);
          break;
        case 'Escape':
          p.setNowPlaying(false);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusSearch]);
}
