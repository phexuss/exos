import { ChevronLeft, ChevronRight, Minus, Search, Square, X } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { bridge } from '@/lib/bridge';
import { IS_MAC, IS_MOCK } from '@/lib/env';
import { useT } from '@/i18n';
import { useNav } from '@/store/nav';
import { useSettings } from '@/store/settings';
import { FpsMeter } from './FpsMeter';

/** Minimise, maximise and close for the frameless window (macOS keeps its own buttons). */
export function WindowControls() {
  const { t } = useT();
  if (!bridge || IS_MAC) return null;
  const { win } = bridge;
  return (
    <div className="winctl">
      <button type="button" aria-label={t('window.minimize')} onClick={() => void win.minimize()}>
        <Minus size={16} />
      </button>
      <button type="button" aria-label={t('window.maximize')} onClick={() => void win.toggleMaximize()}>
        <Square size={13} />
      </button>
      <button type="button" className="close" aria-label={t('window.close')} onClick={() => void win.close()}>
        <X size={17} />
      </button>
    </div>
  );
}

export const TitleBar = forwardRef<HTMLInputElement>(function TitleBar(_, searchRef) {
  const { back, forward, canBack, canForward, go, route } = useNav();
  const [q, setQ] = useState('');
  const showFps = useSettings((s) => s.showFps);
  const { t } = useT();

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
    <header className="titlebar" onDoubleClick={(e) => e.target === e.currentTarget && void bridge?.win.toggleMaximize()}>
      <div className="titlebar__brand">
        <span className="wordmark">
          EX<span>Ø</span>S
        </span>
      </div>
      <div className="titlebar__nav">
        <button
          type="button"
          className="icon-btn"
          disabled={!canBack}
          onClick={back}
          aria-label={t('nav.back')}
          title={`${t('nav.back')} (Alt+←)`}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={!canForward}
          onClick={forward}
          aria-label={t('nav.forward')}
          title={`${t('nav.forward')} (Alt+→)`}
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
          placeholder={t('window.searchPlaceholder')}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => route.name !== 'search' && go({ name: 'search', q: q.trim() || undefined })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim()) go({ name: 'search', q: q.trim() });
          }}
        />
        <span className="kbd">Ctrl K</span>
      </label>
      <div className="titlebar__drag" />
      {showFps && <FpsMeter />}
      {IS_MOCK && (
        <span className="kbd" style={{ marginRight: 14, fontSize: 11.5, padding: '5px 8px' }}>
          {t('window.mock')}
        </span>
      )}
      <WindowControls />
    </header>
  );
});
