import { CircleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Ambient } from '@/components/Ambient';
import { ContextMenu } from '@/components/ContextMenu';
import { ScreenBoundary } from '@/components/ErrorBoundary';
import { NowPlaying } from '@/components/NowPlaying';
import { PlayerBar } from '@/components/PlayerBar';
import { SidePanel } from '@/components/SidePanel';
import { Sidebar } from '@/components/Sidebar';
import { TitleBar } from '@/components/TitleBar';
import { Toasts } from '@/components/Toasts';
import { useAccent } from '@/hooks/useAccent';
import { IS_TAURI } from '@/lib/env';
import { exampleTracks } from '@/lib/mock';
import { installMotion } from '@/lib/motion';

const IS_MAC = IS_TAURI && /Mac/i.test(navigator.userAgent);
import { useHotkeys } from '@/hooks/useHotkeys';
import { Album } from '@/screens/Album';
import { Artist } from '@/screens/Artist';
import { Downloads } from '@/screens/Downloads';
import { Home } from '@/screens/Home';
import { Library } from '@/screens/Library';
import { Login } from '@/screens/Login';
import { Search } from '@/screens/Search';
import { Settings } from '@/screens/Settings';
import { useAuth } from '@/store/auth';
import { useEngine } from '@/store/engine';
import { useLibrary } from '@/store/library';
import { useNav } from '@/store/nav';
import { usePlayer } from '@/store/player';
import { useSettings } from '@/store/settings';

function EngineBanner() {
  const status = useEngine((s) => s.status);
  const go = useNav((s) => s.go);
  if (!status || (status.ytdlp && status.jsRuntime)) return null;
  return (
    <div className="banner" style={{ margin: '24px var(--gutter) 0' }}>
      <CircleAlert size={22} />
      <div>
        <div style={{ fontWeight: 500 }}>
          {status.ytdlp ? 'Для YouTube не хватает JS-движка' : 'Нужно поставить yt-dlp'}
        </div>
        <div className="muted" style={{ fontSize: 13 }}>
          Музыка качается и играет через yt-dlp на этом компьютере. Ставится в один клик в Настройках.
        </div>
      </div>
      <button type="button" className="btn primary sm" onClick={() => go({ name: 'settings' })}>
        Установить
      </button>
    </div>
  );
}

function Screen() {
  const route = useNav((s) => s.route);
  const dir = useNav((s) => s.dir);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [route]);
  let screen: React.ReactNode;
  switch (route.name) {
    case 'home':
      screen = <Home />;
      break;
    case 'search':
      screen = <Search q={route.q} />;
      break;
    case 'library':
      screen = <Library />;
      break;
    case 'downloads':
      screen = <Downloads />;
      break;
    case 'settings':
      screen = <Settings />;
      break;
    case 'album':
      screen = <Album id={route.id} />;
      break;
    case 'artist':
      screen = <Artist id={route.id} />;
      break;
  }
  return (
    <main className="main">
      <div className="scroller" ref={ref}>
        {route.name !== 'settings' && <EngineBanner />}
        <div key={JSON.stringify(route)} className="route" style={{ '--dir': dir } as React.CSSProperties}>
          <ScreenBoundary>{screen}</ScreenBoundary>
        </div>
      </div>
    </main>
  );
}

export function App() {
  const auth = useAuth((s) => s.status);
  const glass = useSettings((s) => s.glassMode);
  const current = usePlayer((s) => s.current);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchRef.current?.focus(), []);

  useEffect(() => {
    installMotion();
    void useAuth.getState().bootstrap();
    void useEngine.getState().refresh();
    if (import.meta.env.MODE === 'prototype') {
      // The design preview opens mid-session so every part of the shell is filled.
      setTimeout(() => {
        usePlayer.getState().playQueue(exampleTracks, 4);
        if (window.innerWidth >= 1100) usePlayer.getState().setPanel('lyrics');
      }, 600);
    }
  }, []);
  useEffect(() => {
    if (auth === 'signedIn') void useLibrary.getState().load();
  }, [auth]);
  useAccent(current);
  useHotkeys(focusSearch);

  if (auth === 'loading') return <div className="shell flat" />;
  if (auth === 'signedOut') return <Login />;

  return (
    <div className={`shell ${glass ? 'glass' : 'flat'} ${IS_MAC ? 'is-mac' : ''}`} onContextMenu={(e) => e.preventDefault()}>
      {glass && <Ambient />}
      <TitleBar ref={searchRef} />
      <Sidebar />
      <Screen />
      <SidePanel />
      <PlayerBar />
      <NowPlaying />
      <ContextMenu />
      <Toasts />
    </div>
  );
}
