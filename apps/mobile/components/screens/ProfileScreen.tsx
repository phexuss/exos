import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/AnimatedPressable';
import { AppDialog } from '@/components/AppDialog';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { EditFieldModal } from '@/components/auth/EditFieldModal';
import { Rise } from '@/components/motion/Rise';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { PillButton } from '@/components/ui/PillButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionLabel, SettingsGroup } from '@/components/ui/SettingsGroup';
import { SheetItem } from '@/components/ui/SheetItem';
import { COLORS } from '@/constants/colors';
import { GLASS } from '@/constants/glass';
import { SPACING } from '@/constants/spacing';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useI18n } from '@/hooks/useI18n';
import { ApiError } from '@/services/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { useOverlayStore } from '@/store/useOverlayStore';

type EditableField = 'name' | 'username' | 'email';

/** Avatar diameter in the profile head. */
const AVATAR = 72;

function ProfileRow({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  /** No divider under the last row of a group. */
  last?: boolean;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      // A row in a grouped card stays put and lights up edge to edge.
      scaleValue={1}
      highlightRadius={0}
      highlightBleed={16}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: COLORS.divider,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText
          variant="caption"
          style={{ color: COLORS.textMuted, fontSize: 12 }}
        >
          {label}
        </AppText>
        {value !== undefined ? (
          <AppText variant="label" weight="medium" numberOfLines={1}>
            {value}
          </AppText>
        ) : null}
      </View>
      <AppIcon name="chevron-right" size={16} color={COLORS.textMuted} />
    </AnimatedPressable>
  );
}

export function ProfileScreen() {
  const { t } = useI18n();
  const glassMode = useGlassMode();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const changePassword = useAuthStore((s) => s.changePassword);
  const logout = useAuthStore((s) => s.logout);
  const closeProfile = useOverlayStore((s) => s.closeProfile);
  const closeAllOverlays = useOverlayStore((s) => s.closeAll);
  const openSettings = useOverlayStore((s) => s.openSettings);

  const [editing, setEditing] = useState<EditableField | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      setShowLogoutConfirm(false);
      closeProfile();
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSaveField = async (
    field: EditableField,
    value: string,
    currentPassword?: string,
  ) => {
    try {
      await updateProfile(
        field === 'email'
          ? { email: value, currentPassword }
          : { [field]: value },
      );
      if (field === 'email') {
        setNotice({
          title: t('common.save'),
          message: t('profile.emailReverify'),
        });
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
      setNotice({
        title: t('common.save'),
        message: t('profile.passwordChanged'),
      });
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
    closeAllOverlays();
    router.navigate('/library' as never);
  };

  if (!user) {
    return null;
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <>
      <ScreenContainer>
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

        <Rise index={0}>
          <View
            style={{
              alignItems: 'center',
              gap: SPACING.md,
              paddingVertical: SPACING.xl,
            }}
          >
            <View
              style={{
                width: AVATAR,
                height: AVATAR,
                borderRadius: AVATAR / 2,
                backgroundColor: COLORS.accentSubtle,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: GLASS.rimStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText
                weight="black"
                style={{ fontSize: 30, color: COLORS.accent }}
              >
                {initial}
              </AppText>
            </View>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <AppText variant="title" weight="bold" numberOfLines={1}>
                {user.name}
              </AppText>
              <AppText
                variant="label"
                style={{ color: COLORS.textMuted }}
                numberOfLines={1}
              >
                @{user.username}
              </AppText>
            </View>
            {user.isVerified ? (
              <View
                style={[styles.chip, { backgroundColor: COLORS.accentSubtle }]}
              >
                <AppIcon name="check" size={14} color={COLORS.accent} />
                <AppText
                  variant="caption"
                  weight="medium"
                  style={{ color: COLORS.accent }}
                >
                  {t('profile.verified')}
                </AppText>
              </View>
            ) : (
              <AnimatedPressable
                onPress={handleVerify}
                scaleValue={0.95}
                hitSlop={6}
                accessibilityRole="button"
                style={[
                  styles.chip,
                  {
                    backgroundColor: COLORS.fill2,
                    borderColor: GLASS.rim,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  weight="medium"
                  style={{ color: COLORS.warning }}
                >
                  {t('profile.notVerified')}
                </AppText>
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{ color: COLORS.accent }}
                >
                  {t('profile.verifyNow')}
                </AppText>
              </AnimatedPressable>
            )}
          </View>
        </Rise>

        <Rise index={1} style={{ gap: 12 }}>
          <SectionLabel icon="profile" label={t('profile.accountSection')} />
          <SettingsGroup glass={glassMode}>
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
              last
            />
          </SettingsGroup>
        </Rise>

        <Rise index={2} style={{ marginTop: SPACING.xl }}>
          <SettingsGroup glass={glassMode}>
            <View style={{ marginHorizontal: -10, paddingVertical: 6 }}>
              <SheetItem
                icon="library"
                label={t('profile.openLibrary')}
                detail={t('profile.viewPlaylists')}
                next
                onPress={handleOpenLibrary}
              />
            </View>
          </SettingsGroup>
        </Rise>

        <Rise
          index={3}
          style={{ flexDirection: 'row', marginTop: SPACING.xxl }}
        >
          <PillButton
            label={t('profile.logout')}
            tone="danger"
            onPress={handleLogout}
          />
        </Rise>
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
        requirePassword
        onClose={() => setEditing(null)}
        onSubmit={(v, password) => handleSaveField('email', v, password)}
      />
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSubmit={handleChangePassword}
      />
      <AppDialog
        visible={showLogoutConfirm}
        title={t('profile.logoutConfirmTitle')}
        message={t('profile.logoutConfirmDesc')}
        cancelLabel={t('common.cancel')}
        confirmLabel={t('profile.logout')}
        confirmTone="danger"
        busy={loggingOut}
        onClose={() => {
          if (!loggingOut) setShowLogoutConfirm(false);
        }}
        onConfirm={confirmLogout}
      />
      <AppDialog
        visible={!!notice}
        title={notice?.title ?? ''}
        message={notice?.message}
        confirmLabel={t('common.close')}
        showCancel={false}
        onConfirm={() => setNotice(null)}
        onClose={() => setNotice(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: GLASS.radius.capsule,
  },
});
