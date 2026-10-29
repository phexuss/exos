import { WindowControls } from '@/components/TitleBar';
import { type FormEvent, useState } from 'react';
import { Tabs } from '@/components/Tabs';
import { useT } from '@/i18n';
import { useAuth } from '@/store/auth';
import { useSettings } from '@/store/settings';

export function Login() {
  const login = useAuth((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { t, locale } = useT();
  const setSettings = useSettings((s) => s.set);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError(t('login.missing'));
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
      <div className="login__winctl drag">
        <Tabs
          value={locale}
          onChange={(l) => setSettings({ locale: l })}
          options={[
            { value: 'ru', label: 'RU' },
            { value: 'en', label: 'EN' },
          ]}
        />
        <WindowControls />
      </div>
      <div className="login__art drag">
        <div className="login__mark">
          EX<span>Ø</span>S
        </div>
        <div className="login__tag">{t('login.tagline')}</div>
      </div>
      <form className="login__form" onSubmit={submit}>
        <h1 className="h1">{t('login.title')}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {t('login.sameAccount')}
        </p>
        <div className="field">
          <label htmlFor="login-username">{t('login.username')}</label>
          <input
            id="login-username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">{t('login.password')}</label>
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
          {busy ? t('login.signingIn') : t('login.submit')}
        </button>
        <p className="muted" style={{ fontSize: 13 }}>
          {t('login.noAccount')}
        </p>
      </form>
    </div>
  );
}
