import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { GlassAmbientBackground } from '@/components/glass/GlassAmbientBackground';
import {
  glassPushEntering,
  glassPushExiting,
} from '@/components/glass/transitions';
import { FaqScreen } from '@/components/screens/FaqScreen';
import { COLORS } from '@/constants/colors';
import { useGlassMode } from '@/hooks/useGlassMode';
import { useOverlayStore } from '@/store/useOverlayStore';

export function FaqOverlay() {
  const glassMode = useGlassMode();
  const isFaqOpen = useOverlayStore((s) => s.isFaqOpen);
  const closeFaq = useOverlayStore((s) => s.closeFaq);

  useEffect(() => {
    if (!isFaqOpen) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeFaq();
      return true;
    });

    return () => sub.remove();
  }, [isFaqOpen, closeFaq]);

  if (!isFaqOpen) return null;

  return (
    <Animated.View
      entering={glassMode ? glassPushEntering() : SlideInRight.duration(280)}
      exiting={glassMode ? glassPushExiting() : SlideOutRight.duration(240)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1002,
        backgroundColor: COLORS.background,
      }}
    >
      {glassMode ? <GlassAmbientBackground /> : null}
      <FaqScreen onDismiss={closeFaq} />
    </Animated.View>
  );
}
