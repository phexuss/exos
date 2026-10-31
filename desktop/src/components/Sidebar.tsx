import { ArrowDownToLine, Cloud, Home, Import, Library, LogOut, Plus, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { useT } from '@/i18n';
import { dragged, endDrag } from '@/lib/drag';
import { snappy } from '@/lib/springs';
import type { Playlist } from '@/lib/types';
import { useAuth } from '@/store/auth';
import { useCloud } from '@/store/cloud';
import { useEngine } from '@/store/engine';
import { useLibrary } from '@/store/library';
import { type Route, useNav } from '@/store/nav';
import { usePlaylists } from '@/store/playlists';
import { PlaylistCover } from './PlaylistCover';

/** A playlist in the sidebar; tracks dragged from any list drop onto it. */
function PlaylistItem({ playlist, active }: { playlist: Playlist; active: boolean }) {
  const go = useNav((s) => s.go);
  const add = usePlaylists((s) => s.add);
  const [over, setOver] = useState(false);
  return (
    <button
      type="button"
      className={`nav__item pl-item ${active ? 'is-active' : ''} ${over ? 'is-drop' : ''}`}
      onClick={() => go({ name: 'playlist', id: playlist.id })}
      title={playlist.name}
      onDragOver={(e) => {
        if (!dragged()) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        const d = dragged();
        setOver(false);
        if (!d) return;
        e.preventDefault();
        add(playlist.id, d.tracks);
        endDrag();
      }}
    >
      {active && <motion.span layoutId="nav-pill" className="nav__pill" transition={snappy} />}
      <PlaylistCover playlist={playlist} className="pl-item__cover" />
      <span className="ellipsis">{playlist.name}</span>
    </button>
  );
}

export function Sidebar() {
  const { route, go } = useNav();
  const active = useLibrary((s) =>
    Object.values(s.jobs).filter((j) => j.stage !== 'done' && j.stage !== 'error').length,
  );
  const count = useLibrary((s) => s.tracks.length);
  const cloud = useCloud((s) => s.items.length);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const status = useEngine((s) => s.status);
  const playlists = usePlaylists((s) => s.playlists);
  const { t } = useT();

  const item = (r: Route, icon: React.ReactNode, label: string, badge?: number) => (
    <button
      type="button"
      className={`nav__item ${route.name === r.name ? 'is-active' : ''}`}
      onClick={() => go(r)}
      title={label}
    >
      {route.name === r.name && <motion.span layoutId="nav-pill" className="nav__pill" transition={snappy} />}
      {icon}
      <span>{label}</span>
      {badge ? <em className="nav__badge">{badge}</em> : null}
    </button>
  );

  const ready = status?.ytdlp && status.jsRuntime;
  const dot = !status ? 'warn' : !status.ytdlp ? 'bad' : ready ? '' : 'warn';

  return (
    <aside className="sidebar slab">
      <nav className="nav">
        {item({ name: 'home' }, <Home size={20} />, t('nav.home'))}
        {item({ name: 'search' }, <Search size={20} />, t('nav.search'))}
      </nav>
      <nav className="nav">
        <div className="nav__label">{t('nav.myMusic')}</div>
        {item({ name: 'library' }, <Library size={20} />, `${t('nav.library')}${count ? ` · ${count}` : ''}`)}
        {item({ name: 'downloads' }, <ArrowDownToLine size={20} />, t('nav.downloads'), active)}
        {item({ name: 'cloud' }, <Cloud size={20} />, `${t('nav.cloud')}${cloud ? ` · ${cloud}` : ''}`)}
      </nav>
      <nav className="nav sidebar__playlists">
        <div className="nav__label nav__label--action">
          <span>{t('playlist.playlists')}</span>
          <button
            type="button"
            className={`icon-btn sm ${route.name === 'import' ? 'is-on' : ''}`}
            aria-label={t('importer.button')}
            title={t('importer.button')}
            onClick={() => go({ name: 'import' })}
          >
            <Import size={16} />
          </button>
          <button
            type="button"
            className="icon-btn sm"
            aria-label={t('playlist.create')}
            title={t('playlist.create')}
            onClick={() => go({ name: 'playlist', id: usePlaylists.getState().create() })}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="sidebar__scroll">
          {playlists.map((pl) => (
            <PlaylistItem key={pl.id} playlist={pl} active={route.name === 'playlist' && route.id === pl.id} />
          ))}
          {!playlists.length && <div className="nav__empty">{t('playlist.none')}</div>}
        </div>
      </nav>
      {/* Only asks for attention when a tool is missing; a working engine stays out of the way. */}
      {!ready && status && (
        <button
          type="button"
          className="engine-chip"
          onClick={() => go({ name: 'settings' })}
          title={t('engine.chipTitle')}
        >
          <span className={`engine-chip__dot ${dot}`} />
          <span className="engine-chip__title">
            {status?.ytdlp ? `yt-dlp ${status.ytdlp.version}` : t('engine.ytdlpMissing')}
          </span>
          <span className="engine-chip__sub">
            {status?.ytdlp ? t('engine.fromYourIp') : t('engine.clickToInstall')}
          </span>
        </button>
      )}
      <nav className="nav">{item({ name: 'settings' }, <Settings size={20} />, t('nav.settings'))}</nav>
      <div className="profile-row">
        <span className="avatar">{(user?.name ?? user?.username ?? '?').charAt(0).toUpperCase()}</span>
        <span className="ellipsis" style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }} className="ellipsis">
            {user?.name ?? t('nav.account')}
          </div>
          <div className="muted ellipsis" style={{ fontSize: 12 }}>
            @{user?.username ?? '—'}
          </div>
        </span>
        <button
          type="button"
          className="icon-btn sm"
          title={t('common.signOut')}
          aria-label={t('common.signOut')}
          onClick={() => void logout()}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
