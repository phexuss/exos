import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, User } from 'lucide-react';
import { motion, useAnimationControls } from 'motion/react';
import { type FormEvent, useState } from 'react';
import { Aurora, Wordmark } from '@/components/Brand';
import { Tabs } from '@/components/Tabs';
import { WindowControls } from '@/components/TitleBar';
import { useT } from '@/i18n';
import { reducedMotion } from '@/lib/motion';
import { soft } from '@/lib/springs';
import { useAuth } from '@/store/auth';
import { useSettings } from '@/store/settings';

/** How long the screen takes to clear before the app opens; matches --dur-3. */
const LEAVE_MS = 520;

export function Login() {
  const login = useAuth((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const card = useAnimationControls();
  const { t, locale } = useT();
  const setSettings = useSettings((s) => s.set);

  const fail = (message: string) => {
    setError(message);
    if (!reducedMotion()) void card.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.42 } });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!username.trim() || !password) {
      fail(t('login.missing'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // The wordmark glides to the middle and the form clears; the app opens from there.
      await login(username.trim(), password, async () => {
        setLeaving(true);
        if (!reducedMotion()) await new Promise((r) => setTimeout(r, LEAVE_MS));
      });
    } catch (err) {
      setLeaving(false);
      setBusy(false);
      fail(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className={`login ${leaving ? 'is-leaving' : ''}`}>
      <Aurora />
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
        <motion.div layout="position" transition={soft} className="login__mark">
          <Wordmark />
        </motion.div>
        <p className="login__tag">{t('login.tagline')}</p>
        <p className="login__sources">Deezer · SoundCloud · YouTube</p>
      </div>
      <div className="login__side">
        <motion.form className="login__card" onSubmit={submit} animate={card} noValidate>
          <div className="login__head">
            <h1 className="h1">{t('login.title')}</h1>
            <p className="muted">{t('login.sameAccount')}</p>
          </div>
          <label className="login__field">
            <span>{t('login.username')}</span>
            <span className="login__input">
              <User size={18} aria-hidden="true" />
              <input
                id="login-username"
                autoComplete="username"
                spellCheck={false}
                value={username}
                disabled={busy}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                autoFocus
              />
            </span>
          </label>
          <label className="login__field">
            <span>{t('login.password')}</span>
            <span className="login__input">
              <Lock size={18} aria-hidden="true" />
              <input
                id="login-password"
                type={reveal ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                disabled={busy}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
              />
              <button
                type="button"
                className="login__peek"
                aria-label={reveal ? t('login.hidePassword') : t('login.showPassword')}
                title={reveal ? t('login.hidePassword') : t('login.showPassword')}
                onClick={() => setReveal(!reveal)}
              >
                {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="btn primary login__submit" disabled={busy}>
            {busy ? <LoaderCircle size={18} className="login__spin" /> : null}
            <span>{busy ? t('login.signingIn') : t('login.submit')}</span>
            {!busy && <ArrowRight size={18} className="login__arrow" />}
          </button>
          <p className="login__foot">{t('login.noAccount')}</p>
        </motion.form>
      </div>
    </div>
  );
}
