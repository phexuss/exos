import { ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import { COLORS } from "@/constants/colors";
import { LanguageProvider } from "@/providers/LanguageProvider";

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
    regular: { fontFamily: "Satoshi-Regular", fontWeight: "400" as const },
    medium: { fontFamily: "Satoshi-Medium", fontWeight: "500" as const },
    bold: { fontFamily: "Satoshi-Bold", fontWeight: "700" as const },
    heavy: { fontFamily: "Satoshi-Black", fontWeight: "900" as const },
  },
};

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Satoshi-Light": require("@/assets/fonts/Satoshi-Light.otf"),
    "Satoshi-Regular": require("@/assets/fonts/Satoshi-Regular.otf"),
    "Satoshi-Medium": require("@/assets/fonts/Satoshi-Medium.otf"),
    "Satoshi-Bold": require("@/assets/fonts/Satoshi-Bold.otf"),
    "Satoshi-Black": require("@/assets/fonts/Satoshi-Black.otf"),
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <LanguageProvider>
        <ThemeProvider value={EXOS_THEME}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: COLORS.background },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="player"
              options={{
                presentation: "transparentModal",
                headerShown: false,
                animation: "slide_from_bottom",
                animationDuration: 300,
                gestureEnabled: true,
                gestureDirection: "vertical",
                fullScreenGestureEnabled: true,
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                headerShown: false,
                animation: "fade_from_bottom",
                animationDuration: 250,
              }}
            />
            <Stack.Screen
              name="profile"
              options={{
                headerShown: false,
                animation: "fade_from_bottom",
                animationDuration: 250,
              }}
            />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
