import { ArrowDownToLine, Home, Library, LogOut, Search, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { snappy } from '@/lib/springs';
import { useAuth } from '@/store/auth';
import { useEngine } from '@/store/engine';
import { useLibrary } from '@/store/library';
import { type Route, useNav } from '@/store/nav';

export function Sidebar() {
  const { route, go } = useNav();
  const active = useLibrary((s) =>
    Object.values(s.jobs).filter((j) => j.stage !== 'done' && j.stage !== 'error').length,
  );
  const count = useLibrary((s) => s.tracks.length);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const status = useEngine((s) => s.status);

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
        {item({ name: 'home' }, <Home size={20} />, 'Главная')}
        {item({ name: 'search' }, <Search size={20} />, 'Поиск')}
      </nav>
      <nav className="nav">
        <div className="nav__label">Моя музыка</div>
        {item({ name: 'library' }, <Library size={20} />, `На компьютере${count ? ` · ${count}` : ''}`)}
        {item({ name: 'downloads' }, <ArrowDownToLine size={20} />, 'Загрузки', active)}
      </nav>
      <div className="sidebar__spacer" />
      <button type="button" className="engine-chip" onClick={() => go({ name: 'settings' })} title="Локальный движок">
        <span className={`engine-chip__dot ${dot}`} />
        <span className="engine-chip__title">
          {status?.ytdlp ? `yt-dlp ${status.ytdlp.version}` : 'yt-dlp не установлен'}
        </span>
        <span className="engine-chip__sub">
          {status?.ytdlp ? 'Качает с твоего IP, без сервера' : 'Нажми, чтобы установить'}
        </span>
      </button>
      <nav className="nav">
        {item({ name: 'settings' }, <Settings size={20} />, 'Настройки')}
      </nav>
      <div className="profile-row">
        <span className="avatar">{(user?.name ?? user?.username ?? '?').charAt(0).toUpperCase()}</span>
        <span className="ellipsis" style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }} className="ellipsis">
            {user?.name ?? 'Аккаунт'}
          </div>
          <div className="muted ellipsis" style={{ fontSize: 12 }}>
            @{user?.username ?? '—'}
          </div>
        </span>
        <button type="button" className="icon-btn sm" title="Выйти" aria-label="Выйти" onClick={() => void logout()}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
