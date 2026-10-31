import { ArrowRight, AtSign, Eye, EyeOff, KeyRound, LoaderCircle, Lock, Mail, User } from 'lucide-react';
import { AnimatePresence, motion, useAnimationControls } from 'motion/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Aurora, Wordmark } from '@/components/Brand';
import { Tabs } from '@/components/Tabs';
import { WindowControls } from '@/components/TitleBar';
import { type Key, useT } from '@/i18n';
import { ApiError } from '@/lib/api';
import { reducedMotion } from '@/lib/motion';
import { soft } from '@/lib/springs';
import { useAuth } from '@/store/auth';
import { useSettings } from '@/store/settings';

/** How long the screen takes to clear before the app opens; matches --dur-3. */
const LEAVE_MS = 520;
/** Limits from apps/api/src/user/dto/create-user.dto.ts, checked here so the server's English messages never show. */
const NAME_MAX = 16;
const USERNAME_MIN = 2;
const USERNAME_MAX = 36;
const PASSWORD_MIN = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The code the server mails, and how long to wait before asking for another (same as the phone app). */
const CODE_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

type Mode = 'signIn' | 'signUp' | 'verify';

function Field({
  label,
  icon,
  children,
  after,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  after?: ReactNode;
}) {
  return (
    <label className="login__field">
      <span>{label}</span>
      <span className="login__input">
        {icon}
        {children}
        {after}
      </span>
    </label>
  );
}

export function Login() {
  const { login, register, verify, resend } = useAuth.getState();
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState<{ userId: string; email: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const card = useAnimationControls();
  const { t, locale } = useT();
  const setSettings = useSettings((s) => s.set);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const fail = (message: string) => {
    setError(message);
    if (!reducedMotion()) void card.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.42 } });
  };

  const explain = (err: unknown): string => {
    if (err instanceof ApiError) {
      if (err.status === 429) return t('login.tooMany');
      if (err.status === 409) return t(/email/i.test(err.message) ? 'login.emailTaken' : 'login.usernameTaken');
      if (mode === 'verify' && (err.status === 401 || err.status === 400)) return t('login.badCode');
      if (mode === 'signIn' && err.status === 401) return t('login.wrong');
    }
    return err instanceof Error ? err.message : String(err);
  };

  // The wordmark glides to the middle and the form clears; the app opens from there.
  const enter = async () => {
    setLeaving(true);
    if (!reducedMotion()) await new Promise((r) => setTimeout(r, LEAVE_MS));
  };

  const switchTo = (next: Mode) => {
    setMode(next);
    setError(null);
    setNote(null);
    setReveal(false);
  };

  const check = (): Key | null => {
    if (mode === 'signIn') return !username.trim() || !password ? 'login.missing' : null;
    if (mode === 'verify') return code.length !== CODE_LENGTH ? 'login.codeMissing' : null;
    if (!name.trim() || !username.trim() || !email.trim() || !password) return 'login.fillAll';
    if (name.trim().length > NAME_MAX) return 'login.nameLong';
    if (username.trim().length < USERNAME_MIN || username.trim().length > USERNAME_MAX) return 'login.usernameLength';
    if (!EMAIL_RE.test(email.trim())) return 'login.badEmail';
    if (password.length < PASSWORD_MIN) return 'login.passwordShort';
    return null;
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const problem = check();
    if (problem) {
      fail(t(problem, { min: PASSWORD_MIN, max: NAME_MAX, from: USERNAME_MIN, to: USERNAME_MAX }));
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      if (mode === 'signIn') await login(username.trim(), password, enter);
      else if (mode === 'signUp') {
        const created = await register({
          name: name.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
        });
        setPending(created);
        setCode('');
        setCooldown(RESEND_COOLDOWN_S);
        switchTo('verify');
        setBusy(false);
      } else if (pending) await verify(pending.userId, code, enter);
    } catch (err) {
      setLeaving(false);
      setBusy(false);
      fail(explain(err));
    }
  };

  const again = async () => {
    if (!pending || cooldown > 0 || busy) return;
    setError(null);
    try {
      await resend(pending.userId);
      setCooldown(RESEND_COOLDOWN_S);
      setNote(t('login.codeSent'));
    } catch (err) {
      fail(explain(err));
    }
  };

  const peek = (
    <button
      type="button"
      className="login__peek"
      aria-label={reveal ? t('login.hidePassword') : t('login.showPassword')}
      title={reveal ? t('login.hidePassword') : t('login.showPassword')}
      onClick={() => setReveal(!reveal)}
    >
      {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  const edit = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setError(null);
  };

  const label: Record<Mode, { title: Key; sub: Key; submit: Key; busy: Key }> = {
    signIn: { title: 'login.title', sub: 'login.sameAccount', submit: 'login.submit', busy: 'login.signingIn' },
    signUp: { title: 'login.signUpTitle', sub: 'login.signUpSub', submit: 'login.signUp', busy: 'login.signingUp' },
    verify: { title: 'login.verifyTitle', sub: 'login.verifySub', submit: 'login.verify', busy: 'login.verifying' },
  };
  const l = label[mode];

  return (
    <div className={`login ${leaving ? 'is-leaving' : ''}`}>
      <Aurora />
      <div className="login__winctl drag">
        <Tabs
          value={locale}
          onChange={(v) => setSettings({ locale: v })}
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              className="login__step"
              initial={reducedMotion() ? false : { opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion() ? undefined : { opacity: 0, x: -16 }}
              transition={soft}
            >
              <div className="login__head">
                <h1 className="h1">{t(l.title)}</h1>
                <p className="muted">
                  {mode === 'verify' ? t('login.verifySub', { email: pending?.email ?? '' }) : t(l.sub)}
                </p>
              </div>

              {mode === 'signUp' && (
                <>
                  <Field label={t('login.name')} icon={<User size={18} aria-hidden="true" />}>
                    <input
                      id="signup-name"
                      autoComplete="name"
                      maxLength={NAME_MAX}
                      value={name}
                      disabled={busy}
                      onChange={edit(setName)}
                      autoFocus
                    />
                  </Field>
                  <Field label={t('login.username')} icon={<AtSign size={18} aria-hidden="true" />}>
                    <input
                      id="signup-username"
                      autoComplete="username"
                      spellCheck={false}
                      maxLength={USERNAME_MAX}
                      value={username}
                      disabled={busy}
                      onChange={edit(setUsername)}
                    />
                  </Field>
                  <Field label={t('login.email')} icon={<Mail size={18} aria-hidden="true" />}>
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      disabled={busy}
                      onChange={edit(setEmail)}
                    />
                  </Field>
                </>
              )}

              {mode === 'signIn' && (
                <Field label={t('login.username')} icon={<User size={18} aria-hidden="true" />}>
                  <input
                    id="login-username"
                    autoComplete="username"
                    spellCheck={false}
                    value={username}
                    disabled={busy}
                    onChange={edit(setUsername)}
                    autoFocus
                  />
                </Field>
              )}

              {mode !== 'verify' && (
                <Field label={t('login.password')} icon={<Lock size={18} aria-hidden="true" />} after={peek}>
                  <input
                    id={mode === 'signIn' ? 'login-password' : 'signup-password'}
                    type={reveal ? 'text' : 'password'}
                    autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                    value={password}
                    disabled={busy}
                    onChange={edit(setPassword)}
                  />
                </Field>
              )}

              {mode === 'verify' && (
                <Field label={t('login.code')} icon={<KeyRound size={18} aria-hidden="true" />}>
                  <input
                    id="verify-code"
                    className="login__code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    value={code}
                    disabled={busy}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH));
                      setError(null);
                    }}
                    autoFocus
                  />
                </Field>
              )}

              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              {note && !error && (
                <div className="login__note" role="status">
                  {note}
                </div>
              )}

              <button type="submit" className="btn primary login__submit" disabled={busy}>
                {busy ? <LoaderCircle size={18} className="login__spin" /> : null}
                <span>{t(busy ? l.busy : l.submit)}</span>
                {!busy && <ArrowRight size={18} className="login__arrow" />}
              </button>

              {mode === 'signIn' && (
                <p className="login__foot">
                  {t('login.noAccount')}{' '}
                  <button type="button" className="login__switch" onClick={() => switchTo('signUp')}>
                    {t('login.toSignUp')}
                  </button>
                </p>
              )}
              {mode === 'signUp' && (
                <p className="login__foot">
                  {t('login.haveAccount')}{' '}
                  <button type="button" className="login__switch" onClick={() => switchTo('signIn')}>
                    {t('login.toSignIn')}
                  </button>
                </p>
              )}
              {mode === 'verify' && (
                <p className="login__foot login__foot--row">
                  <button type="button" className="login__switch" disabled={cooldown > 0} onClick={again}>
                    {cooldown > 0 ? t('login.resendIn', { s: cooldown }) : t('login.resend')}
                  </button>
                  <button type="button" className="login__switch" onClick={() => switchTo('signUp')}>
                    {t('login.changeEmail')}
                  </button>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.form>
      </div>
    </div>
  );
}
