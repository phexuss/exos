import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
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
                primary
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
      <ScreenHeader
        title={t('youtubeLogin.title')}
        leading="back"
        withTopInset={false}
        onLeadingPress={goBack}
      />
      <AppText variant="body" style={{ color: COLORS.textSecondary }}>
        {t('youtubeLogin.intro')}
      </AppText>
      {!isYtdlpAvailable ? (
        <AppText variant="body" style={{ color: COLORS.warning }}>
          {t('ytdlpLab.unavailable')}
        </AppText>
      ) : (
        <>
          <AppText
            variant="label"
            weight="medium"
            style={{ color: signedIn ? COLORS.accent : COLORS.textPrimary }}
          >
            {signedIn
              ? t('youtubeLogin.statusSignedIn')
              : t('youtubeLogin.statusSignedOut')}
          </AppText>
          <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
            <Pill
              label={
                signedIn ? t('youtubeLogin.switch') : t('youtubeLogin.signIn')
              }
              onPress={() => {
                setError(null);
                setSigningIn(true);
              }}
              primary={!signedIn}
              disabled={busy}
            />
            {signedIn ? (
              <Pill
                label={t('youtubeLogin.signOut')}
                onPress={() => void signOut()}
                disabled={busy}
              />
            ) : null}
          </View>
          <AppText variant="caption" style={{ color: COLORS.textMuted }}>
            {t('youtubeLogin.note')}
          </AppText>
          {error ? <ErrorText message={error} /> : null}
        </>
      )}
    </View>
  );
}

function Pill({
  label,
  onPress,
  disabled,
  primary,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: primary ? COLORS.accent : COLORS.surfaceElevated,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <AppText
        variant="label"
        weight="medium"
        style={{ color: primary ? COLORS.background : COLORS.textPrimary }}
      >
        {label}
      </AppText>
    </Pressable>
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
