import { router } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { GlassAmbientBackground } from '@/components/glass/GlassAmbientBackground';
import {
  glassPresentEntering,
  glassPresentExiting,
} from '@/components/glass/transitions';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
import { useAuthStore } from '@/store/useAuthStore';
import { useOverlayStore } from '@/store/useOverlayStore';

function OfflineProfilePrompt() {
  const { t } = useI18n();
  const closeProfile = useOverlayStore((s) => s.closeProfile);
  const openSettings = useOverlayStore((s) => s.openSettings);

  const handleSignIn = () => {
    closeProfile();
    useAuthStore.getState().exitOfflineMode();
    setTimeout(() => {
      router.push('/(auth)/login' as never);
    }, 100);
  };

  const handleSignUp = () => {
    closeProfile();
    useAuthStore.getState().exitOfflineMode();
    setTimeout(() => {
      router.push('/(auth)/register' as never);
    }, 100);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{
        flex: 1,
        paddingHorizontal: SPACING.xxl,
      }}
    >
      <ScreenHeader
        title={t('common.profile')}
        leading="close"
        onLeadingPress={closeProfile}
        trailing={{
          icon: 'settings',
          onPress: openSettings,
          accessibilityLabel: t('common.settings'),
        }}
      />

      {/* Content */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          paddingBottom: 80,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: COLORS.accentSubtle,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="profile" size={32} color={COLORS.accent} />
        </View>

        <View style={{ gap: 6, alignItems: 'center' }}>
          <AppText
            variant="title"
            weight="bold"
            style={{ textAlign: 'center' }}
          >
            {t('auth.offlineProfileTitle')}
          </AppText>
          <AppText
            variant="body"
            style={{
              color: COLORS.textSecondary,
              textAlign: 'center',
              fontSize: 14,
              lineHeight: 20,
              paddingHorizontal: 12,
            }}
          >
            {t('auth.offlineProfileDesc')}
          </AppText>
        </View>

        <View style={{ width: '100%', gap: 10, marginTop: 8 }}>
          <PrimaryButton label={t('auth.signIn')} onPress={handleSignIn} />
          <PrimaryButton
            label={t('auth.signUp')}
            onPress={handleSignUp}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export function ProfileOverlay() {
  const glassMode = useGlassMode();
  const isProfileOpen = useOverlayStore((s) => s.isProfileOpen);
  const isSettingsOpen = useOverlayStore((s) => s.isSettingsOpen);
  const closeProfile = useOverlayStore((s) => s.closeProfile);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isProfileOpen || isSettingsOpen) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeProfile();
      return true;
    });

    return () => sub.remove();
  }, [isProfileOpen, isSettingsOpen, closeProfile]);

  if (!isProfileOpen) return null;

  return (
    <Animated.View
      entering={
        glassMode
          ? glassPresentEntering()
          : SlideInDown.duration(350).damping(28)
      }
      exiting={glassMode ? glassPresentExiting() : SlideOutDown.duration(300)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: COLORS.background,
      }}
    >
      {glassMode ? <GlassAmbientBackground /> : null}
      {user ? <ProfileScreen /> : <OfflineProfilePrompt />}
    </Animated.View>
  );
}
