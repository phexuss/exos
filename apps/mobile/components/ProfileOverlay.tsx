import { router } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Pressable, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SPACING } from '@/constants/spacing';
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
    <View
      style={{
        flex: 1,
        paddingHorizontal: SPACING.xxl,
        paddingTop: SPACING.lg,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={closeProfile}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="chevron-down" size={22} color={COLORS.textMuted} />
        </Pressable>
        <AppText variant="label" weight="bold">
          {t('common.profile')}
        </AppText>
        <Pressable
          onPress={openSettings}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 0.5,
            borderColor: COLORS.border,
          }}
        >
          <AppIcon name="settings" size={18} color={COLORS.textMuted} />
        </Pressable>
      </View>

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
          <AppText variant="title" weight="bold" style={{ textAlign: 'center' }}>
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
    </View>
  );
}

export function ProfileOverlay() {
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
      entering={SlideInDown.duration(350).damping(28)}
      exiting={SlideOutDown.duration(300)}
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
      {user ? <ProfileScreen /> : <OfflineProfilePrompt />}
    </Animated.View>
  );
}
