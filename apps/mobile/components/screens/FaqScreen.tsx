import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeezerIcon } from '@/components/icons/DeezerIcon';
import { SoundCloudIcon } from '@/components/icons/SoundCloudIcon';
import { AppText } from '@/components/ui/AppText';
import { COLORS } from '@/constants/colors';
import { SOURCES } from '@/constants/sources';
import { SPACING } from '@/constants/spacing';
import { useI18n } from '@/hooks/useI18n';

type SourceCardProps = {
  icon: ReactNode;
  name: string;
  pros: string;
  pros2?: string;
  cons: string;
  cons2?: string;
  badge: string;
  badgeColor: string;
};

function SourceCard({ icon, name, pros, pros2, cons, cons2, badge, badgeColor }: SourceCardProps) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 220,
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 16,
        gap: 10,
        borderWidth: 0.5,
        borderColor: COLORS.border,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ gap: 10 }}>
        <View style={{ height: 30, justifyContent: 'center' }}>
          {icon}
        </View>
        <AppText variant="label" weight="bold" style={{ fontSize: 15 }}>
          {name}
        </AppText>

        <View style={{ gap: 6 }}>
          <AppText
            variant="caption"
            style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 }}
          >
            <AppText style={{ color: '#4ADE80', fontSize: 12 }}>+  </AppText>
            {pros}
          </AppText>
          {pros2 ? (
            <AppText
              variant="caption"
              style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 }}
            >
              <AppText style={{ color: '#4ADE80', fontSize: 12 }}>+  </AppText>
              {pros2}
            </AppText>
          ) : null}
          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, fontSize: 12, lineHeight: 18 }}
          >
            <AppText style={{ color: COLORS.danger, fontSize: 12 }}>−  </AppText>
            {cons}
          </AppText>
          {cons2 ? (
            <AppText
              variant="caption"
              style={{ color: COLORS.textMuted, fontSize: 12, lineHeight: 18 }}
            >
              <AppText style={{ color: COLORS.danger, fontSize: 12 }}>−  </AppText>
              {cons2}
            </AppText>
          ) : null}
        </View>
      </View>

      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: badgeColor + '20',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
        }}
      >
        <AppText
          variant="caption"
          weight="medium"
          style={{ color: badgeColor, fontSize: 10, letterSpacing: 0.5 }}
        >
          {badge}
        </AppText>
      </View>
    </View>
  )
}

type InfoCardProps = {
  icon: string;
  title: string;
  body: string;
};

function InfoCard({ icon, title, body }: InfoCardProps) {
  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 18,
        gap: 8,
        borderWidth: 0.5,
        borderColor: COLORS.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AppText style={{ fontSize: 20 }}>{icon}</AppText>
        <AppText variant="label" weight="bold" style={{ fontSize: 15, flex: 1 }}>
          {title}
        </AppText>
      </View>
      <AppText
        variant="body"
        style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 }}
      >
        {body}
      </AppText>
    </View>
  );
}

type FaqScreenProps = {
  onDismiss: () => void;
};

export function FaqScreen({ onDismiss }: FaqScreenProps) {
  const { t } = useI18n();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.md,
          paddingBottom: 40,
          gap: SPACING.xl,
        }}
      >
        <View style={{ alignItems: 'center', gap: 4, marginTop: 8 }}>
          <AppText
            variant="display"
            weight="bold"
            style={{ fontSize: 26, letterSpacing: 1 }}
          >
            EXØS
          </AppText>
          <AppText
            variant="caption"
            style={{ color: COLORS.textMuted, fontSize: 13 }}
          >
            {t('faq.title')}
          </AppText>
        </View>

        <View style={{ gap: 10 }}>
          <AppText
            variant="label"
            weight="medium"
            style={{
              color: COLORS.textSecondary,
              letterSpacing: 1,
              fontSize: 11,
            }}
          >
            {t('faq.sourcesTitle').toUpperCase()}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SourceCard
              icon={<DeezerIcon size={28} color={SOURCES.deezer.color} />}
              name={t('faq.deezerName')}
              pros={t('faq.deezerPros')}
              cons={t('faq.deezerCons')}
              cons2={t('faq.deezerCons2')}
              badge={t('faq.deezerBadge')}
              badgeColor={COLORS.warning}
            />
            <SourceCard
              icon={<SoundCloudIcon size={20} color={SOURCES.soundcloud.color} />}
              name={t('faq.soundcloudName')}
              pros={t('faq.soundcloudPros')}
              pros2={t('faq.soundcloudPros2')}
              cons={t('faq.soundcloudCons')}
              badge={t('faq.soundcloudBadge')}
              badgeColor="#4ADE80"
            />
          </View>
        </View>

        <InfoCard
          icon="⏳"
          title={t('faq.loadingTitle')}
          body={t('faq.loadingBody')}
        />

        <InfoCard
          icon="📥"
          title={t('faq.downloadTitle')}
          body={t('faq.downloadBody')}
        />

        <Pressable
          onPress={onDismiss}
          style={{
            backgroundColor: COLORS.accent,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <AppText variant="label" weight="bold" style={{ fontSize: 15 }}>
            {t('faq.dismiss')}
          </AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
