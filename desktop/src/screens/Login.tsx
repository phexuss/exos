import { type FormEvent, useState } from 'react';
import { useAuth } from '@/store/auth';

export function Login() {
  const login = useAuth((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Введи логин и пароль.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login__art" data-tauri-drag-region>
        <div className="login__mark">
          EX<span>Ø</span>S
        </div>
        <div className="login__tag">Deezer и SoundCloud в одном плеере. На компьютере yt-dlp качает с твоего IP.</div>
      </div>
      <form className="login__form" onSubmit={submit}>
        <h1 className="h1">Вход</h1>
        <p className="muted" style={{ margin: 0 }}>
          Тот же аккаунт, что и в приложении на телефоне.
        </p>
        <div className="field">
          <label htmlFor="login-username">Логин</label>
          <input id="login-username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" className="btn primary" disabled={busy} style={{ justifyContent: 'center', height: 44 }}>
          {busy ? 'Вхожу…' : 'Войти'}
        </button>
        <p className="muted" style={{ fontSize: 13 }}>
          Нет аккаунта? Зарегистрируйся в приложении на телефоне.
        </p>
      </form>
    </div>
  );
}
