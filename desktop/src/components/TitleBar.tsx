import { ChevronLeft, ChevronRight, Minus, Search, Square, X } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { IS_MOCK, IS_TAURI } from '@/lib/env';
import { useNav } from '@/store/nav';

async function win() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  return getCurrentWindow();
}

export const TitleBar = forwardRef<HTMLInputElement>(function TitleBar(_, searchRef) {
  const { back, forward, canBack, canForward, go, route } = useNav();
  const [q, setQ] = useState('');

  useEffect(() => {
    if (route.name === 'search') setQ(route.q ?? '');
  }, [route]);

  // Live search: results follow typing, with a short debounce.
  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(() => go({ name: 'search', q: q.trim() }), 280);
    return () => clearTimeout(t);
  }, [q, go]);

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className="titlebar__brand" data-tauri-drag-region>
        <span className="wordmark">
          EX<span>Ø</span>S
        </span>
        <span className="muted" style={{ fontSize: 12 }}>
          desktop
        </span>
      </div>
      <div className="titlebar__nav">
        <button type="button" className="icon-btn" disabled={!canBack} onClick={back} aria-label="Назад" title="Назад (Alt+←)">
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={!canForward}
          onClick={forward}
          aria-label="Вперёд"
          title="Вперёд (Alt+→)"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <label className="searchbox titlebar__search">
        <Search size={16} />
        <input
          ref={searchRef}
          id="global-search"
          value={q}
          placeholder="Треки, артисты, альбомы, ссылка SoundCloud"
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => route.name !== 'search' && go({ name: 'search', q: q.trim() || undefined })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim()) go({ name: 'search', q: q.trim() });
          }}
        />
        <span className="kbd">Ctrl K</span>
      </label>
      <div className="titlebar__drag" data-tauri-drag-region />
      {IS_MOCK && (
        <span className="kbd" style={{ marginRight: 14, fontSize: 11.5, padding: '5px 8px' }}>
          Макет: данные для примера
        </span>
      )}
      {IS_TAURI && !/Mac/i.test(navigator.userAgent) && (
        <div className="winctl">
          <button type="button" aria-label="Свернуть" onClick={() => void win().then((w) => w.minimize())}>
            <Minus size={16} />
          </button>
          <button type="button" aria-label="Развернуть" onClick={() => void win().then((w) => w.toggleMaximize())}>
            <Square size={13} />
          </button>
          <button type="button" className="close" aria-label="Закрыть" onClick={() => void win().then((w) => w.close())}>
            <X size={17} />
          </button>
        </div>
      )}
    </header>
  );
});
