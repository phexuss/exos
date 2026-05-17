import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

import { ArtistOverlay } from '@/components/ArtistOverlay';
import { FaqOverlay } from '@/components/FaqOverlay';
import { PlayerOverlay } from '@/components/PlayerOverlay';
import { PlaylistOverlay } from '@/components/PlaylistOverlay';
import { ProfileOverlay } from '@/components/ProfileOverlay';
import { SettingsOverlay } from '@/components/SettingsOverlay';
import { COLORS } from '@/constants/colors';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { setUnauthorizedHandler } from '@/services/api/client';
import { getDownloadedTracks } from '@/services/db/database';
import { useAuthStore } from '@/store/useAuthStore';
import { useDownloadStore } from '@/store/useDownloadStore';
import { useOverlayStore } from '@/store/useOverlayStore';

const EXOS_THEME = {
  dark: true,
  colors: {
    primary: COLORS.accent,
    background: COLORS.background,
    card: COLORS.background,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.accent,
  },
  fonts: {
    regular: { fontFamily: 'Jost-Regular', fontWeight: '400' as const },
    medium: { fontFamily: 'Jost-Medium', fontWeight: '500' as const },
    bold: { fontFamily: 'Jost-Bold', fontWeight: '700' as const },
    heavy: { fontFamily: 'Jost-Black', fontWeight: '900' as const },
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

function useAuthRedirect() {
  const segments = useSegments();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = (segments[0] as string | undefined) === '(auth)';

    if (!user && !inAuthGroup) {
      useOverlayStore.getState().closeAll();
      router.replace('/(auth)/welcome' as never);
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)' as never);
    }
  }, [user, isHydrated, segments, router]);
}

function RootNavigator() {
  useAuthRedirect();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Jost-Light': require('@/assets/fonts/Jost-Light.ttf'),
    'Jost-Regular': require('@/assets/fonts/Jost-Regular.ttf'),
    'Jost-Medium': require('@/assets/fonts/Jost-Medium.ttf'),
    'Jost-Bold': require('@/assets/fonts/Jost-Bold.ttf'),
    'Jost-Black': require('@/assets/fonts/Jost-Black.ttf'),
  });
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    getDownloadedTracks()
      .then((tracks) => {
        useDownloadStore.getState().setDownloadedIds(tracks.map((t) => t.id));
      })
      .catch(() => {});

    useAuthStore.getState().checkAuth();

    setUnauthorizedHandler(() => {
      useAuthStore.setState({ user: null });
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (fontsLoaded && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isHydrated]);

  if (!fontsLoaded || !isHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <LanguageProvider>
        <ThemeProvider value={EXOS_THEME}>
          <RootNavigator />
          <StatusBar style="light" />
          <PlaylistOverlay />
          <ArtistOverlay />
          <PlayerOverlay />
          <ProfileOverlay />
          <SettingsOverlay />
          <FaqOverlay />
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
