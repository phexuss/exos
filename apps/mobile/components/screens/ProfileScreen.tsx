import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { EditFieldModal } from '@/components/auth/EditFieldModal';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { COLORS } from '@/constants/colors';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useOverlayStore } from '@/store/useOverlayStore';

type EditableField = 'name' | 'username' | 'email';

function ProfileRow({
  label,
  value,
  onPress,
  trailing,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const Container = onPress ? Pressable : View;
  return (
    <Container
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderBottomColor: COLORS.divider,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 11 }}
        >
          {label}
        </AppText>
        {value !== undefined ? (
          <AppText variant="label" weight="medium" numberOfLines={1}>
            {value}
          </AppText>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <AppIcon name="chevron-right" size={14} color={COLORS.textMuted} />
        ) : null)}
    </Container>
  );
}

export function ProfileScreen() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);
  const logout = useAuthStore((s) => s.logout);
  const closeProfile = useOverlayStore((s) => s.closeProfile);
  const openSettings = useOverlayStore((s) => s.openSettings);

  const [editing, setEditing] = useState<EditableField | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirmTitle'),
      t('profile.logoutConfirmDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            closeProfile();
            await logout();
          },
        },
      ],
    );
  };

  const handleSaveField = async (field: EditableField, value: string) => {
    try {
      await updateProfile({ [field]: value });
      if (field === 'email') {
        Alert.alert(t('common.save'), t('profile.emailReverify'));
      }
    } catch (e) {
      const message = e instanceof ApiError ? e.message : (e as Error).message;
      throw new Error(message);
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert(t('common.save'), t('profile.passwordChanged'));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : (e as Error).message;
      throw new Error(message);
    }
  };

  const handleVerify = () => {
    if (!user) return;
    closeProfile();
    router.push({
      pathname: '/(auth)/verify' as never,
      params: { userId: user.id, email: user.email },
    } as never);
  };

  const handleOpenLibrary = () => {
    closeProfile();
    router.push('/library' as const);
  };

  if (!user) {
    return null;
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <>
      <ScreenContainer>
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

        {/* Avatar header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingVertical: 16,
            borderBottomWidth: 0.5,
            borderBottomColor: COLORS.divider,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: COLORS.accentSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 0.5,
              borderColor: COLORS.border,
            }}
          >
            <AppText
              weight="bold"
              style={{ fontSize: 24, color: COLORS.accent }}
            >
              {initial}
            </AppText>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="body" weight="bold" numberOfLines={1}>
              {user.name}
            </AppText>
            <AppText
              variant="caption"
              style={{ color: COLORS.textMuted }}
              numberOfLines={1}
            >
              @{user.username}
            </AppText>
            {user.isVerified ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <AppIcon name="check" size={12} color={COLORS.accent} />
                <AppText
                  variant="caption"
                  style={{ color: COLORS.accent, fontSize: 11 }}
                >
                  {t('profile.verified')}
                </AppText>
              </View>
            ) : (
              <Pressable
                onPress={handleVerify}
                hitSlop={6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <AppText
                  variant="caption"
                  style={{ color: COLORS.warning, fontSize: 11 }}
                >
                  {t('profile.notVerified')}
                </AppText>
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{ color: COLORS.accent, fontSize: 11 }}
                >
                  · {t('profile.verifyNow')}
                </AppText>
              </Pressable>
            )}
          </View>
        </View>

        {/* Account section */}
        <View style={{ gap: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <AppIcon name="profile" size={14} color={COLORS.textMuted} />
            <AppText
              variant="caption"
              weight="medium"
              style={{
                color: COLORS.textSecondary,
                letterSpacing: 1,
                fontSize: 11,
              }}
            >
              {t('profile.accountSection').toUpperCase()}
            </AppText>
          </View>

          <ProfileRow
            label={t('profile.editName')}
            value={user.name}
            onPress={() => setEditing('name')}
          />
          <ProfileRow
            label={t('profile.editUsername')}
            value={`@${user.username}`}
            onPress={() => setEditing('username')}
          />
          <ProfileRow
            label={t('profile.editEmail')}
            value={user.email}
            onPress={() => setEditing('email')}
          />
          <ProfileRow
            label={t('profile.changePassword')}
            onPress={() => setShowChangePassword(true)}
          />
        </View>

        {/* Library shortcut */}
        <Pressable
          onPress={handleOpenLibrary}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            borderTopWidth: 0.5,
            borderTopColor: COLORS.divider,
            borderBottomWidth: 0.5,
            borderBottomColor: COLORS.divider,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AppIcon name="library" size={18} color={COLORS.textMuted} />
            <View style={{ gap: 2 }}>
              <AppText variant="label" weight="medium">
                {t('profile.openLibrary')}
              </AppText>
              <AppText
                variant="caption"
                style={{ color: COLORS.textMuted, fontSize: 11 }}
              >
                {t('profile.viewPlaylists')}
              </AppText>
            </View>
          </View>
          <AppIcon name="chevron-right" size={14} color={COLORS.textMuted} />
        </Pressable>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            marginTop: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <AppText
            variant="label"
            weight="bold"
            style={{ color: COLORS.danger }}
          >
            {t('profile.logout')}
          </AppText>
        </Pressable>
      </ScreenContainer>

      <EditFieldModal
        visible={editing === 'name'}
        title={t('profile.editName')}
        label={t('profile.editName')}
        initialValue={user.name}
        autoCapitalize="words"
        maxLength={16}
        onClose={() => setEditing(null)}
        onSubmit={(v) => handleSaveField('name', v)}
      />
      <EditFieldModal
        visible={editing === 'username'}
        title={t('profile.editUsername')}
        label={t('profile.editUsername')}
        initialValue={user.username}
        maxLength={36}
        onClose={() => setEditing(null)}
        onSubmit={(v) => handleSaveField('username', v)}
      />
      <EditFieldModal
        visible={editing === 'email'}
        title={t('profile.editEmail')}
        label={t('profile.editEmail')}
        initialValue={user.email}
        keyboardType="email-address"
        onClose={() => setEditing(null)}
        onSubmit={(v) => handleSaveField('email', v)}
      />
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
    </>
  );
}
