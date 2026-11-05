import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { GlassAmbientBackground } from '@/components/glass/GlassAmbientBackground';
import { Rise } from '@/components/motion/Rise';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingsGroup } from '@/components/ui/SettingsGroup';
import { SHEET_TILE } from '@/components/ui/SheetItem';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
import {
  clearYoutubeCookies,
  exportYoutubeCookies,
  hasYoutubeCookies,
  isYtdlpAvailable,
} from '@/modules/exos-ytdlp';

const LOGIN_URL =
  'https://accounts.google.com/ServiceLogin?service=youtube&continue=https%3A%2F%2Fm.youtube.com%2F';

// Google refuses sign-in from user agents that say "wv" (embedded
// WebView). A plain Chrome mobile UA gets the normal login page.
const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

const YOUTUBE_PAGE = /^https:\/\/(m|www)\.youtube\.com\//;

/**
 * Signs in to Google inside the app and hands the session cookies to the
 * on-device yt-dlp. Without them YouTube answers phones with "Sign in to
 * confirm you're not a bot".
 */
export default function YoutubeLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const glassMode = useGlassMode();
  const [signedIn, setSignedIn] = useState(() => hasYoutubeCookies());
  const [signingIn, setSigningIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exporting = useRef(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  }, [router]);

  const saveCookies = useCallback(
    async (manual: boolean) => {
      if (exporting.current) return;
      exporting.current = true;
      try {
        const result = await exportYoutubeCookies();
        if (result.signedIn) {
          setSignedIn(true);
          setSigningIn(false);
          setError(null);
        } else if (manual) {
          setError(t('youtubeLogin.notSignedIn'));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        exporting.current = false;
      }
    },
    [t],
  );

  const onNavigation = useCallback(
    (nav: WebViewNavigation) => {
      // Google sends the browser back to YouTube once the login is done.
      if (!nav.loading && YOUTUBE_PAGE.test(nav.url)) void saveCookies(false);
    },
    [saveCookies],
  );

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await clearYoutubeCookies();
      setSignedIn(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  if (signingIn) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            paddingTop: insets.top + SPACING.sm,
            paddingHorizontal: SPACING.lg,
            paddingBottom: SPACING.sm,
          }}
        >
          <ScreenHeader
            title={t('youtubeLogin.title')}
            leading="close"
            withTopInset={false}
            onLeadingPress={() => setSigningIn(false)}
            trailingNode={
              <Pill
                label={t('youtubeLogin.done')}
                onPress={() => void saveCookies(true)}
              />
            }
          />
          {error ? <ErrorText message={error} /> : null}
        </View>
        <WebView
          source={{ uri: LOGIN_URL }}
          userAgent={USER_AGENT}
          onNavigationStateChange={onNavigation}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          domStorageEnabled
          javaScriptEnabled
          startInLoadingState
          renderLoading={() => (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: COLORS.background,
              }}
            >
              <ActivityIndicator color={COLORS.accent} />
            </View>
          )}
          style={{ flex: 1, backgroundColor: COLORS.background }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: insets.top + SPACING.md,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.lg,
      }}
    >
      {glassMode ? <GlassAmbientBackground /> : null}
      <ScreenHeader
        title={t('youtubeLogin.title')}
        leading="back"
        withTopInset={false}
        onLeadingPress={goBack}
      />
      <Rise index={0}>
        <AppText variant="body" style={{ color: COLORS.textSecondary }}>
          {t('youtubeLogin.intro')}
        </AppText>
      </Rise>
      {!isYtdlpAvailable ? (
        <AppText variant="body" style={{ color: COLORS.warning }}>
          {t('ytdlpLab.unavailable')}
        </AppText>
      ) : (
        <Rise index={1} style={{ gap: SPACING.md }}>
          <SettingsGroup glass={glassMode}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.md,
                paddingVertical: SPACING.lg,
              }}
            >
              <View
                style={{
                  width: SHEET_TILE,
                  height: SHEET_TILE,
                  borderRadius: 12,
                  backgroundColor: signedIn
                    ? COLORS.accentSubtle
                    : COLORS.fill2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppIcon
                  name={signedIn ? 'check' : 'profile'}
                  size={20}
                  color={signedIn ? COLORS.accent : COLORS.textSecondary}
                />
              </View>
              <AppText
                variant="label"
                weight="medium"
                style={{
                  flex: 1,
                  color: signedIn ? COLORS.accent : COLORS.textPrimary,
                }}
              >
                {signedIn
                  ? t('youtubeLogin.statusSignedIn')
                  : t('youtubeLogin.statusSignedOut')}
              </AppText>
            </View>
          </SettingsGroup>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <PillButton
              label={
                signedIn ? t('youtubeLogin.switch') : t('youtubeLogin.signIn')
              }
              onPress={() => {
                setError(null);
                setSigningIn(true);
              }}
              tone={signedIn ? 'quiet' : 'accent'}
              disabled={busy}
            />
            {signedIn ? (
              <PillButton
                label={t('youtubeLogin.signOut')}
                onPress={() => void signOut()}
                tone="danger"
                disabled={busy}
              />
            ) : null}
          </View>
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            {t('youtubeLogin.note')}
          </AppText>
          {error ? <ErrorText message={error} /> : null}
        </Rise>
      )}
    </View>
  );
}

/** Compact accent pill for the header while the sign-in page is open. */
function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleValue={0.94}
      accessibilityRole="button"
      style={{
        height: 34,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: COLORS.accent,
      }}
    >
      <AppText variant="label" weight="bold" style={{ color: COLORS.onAccent }}>
        {label}
      </AppText>
    </AnimatedPressable>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <AppText
      variant="caption"
      style={{ color: COLORS.warning, marginTop: SPACING.sm }}
    >
      {message}
    </AppText>
  );
}
