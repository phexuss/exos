import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';

import { FaqScreen } from '@/components/screens/FaqScreen';
import { COLORS } from '@/constants/colors';
import { useOverlayStore } from '@/store/useOverlayStore';

export function FaqOverlay() {
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
      entering={SlideInRight.duration(280)}
      exiting={SlideOutRight.duration(240)}
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
      <FaqScreen onDismiss={closeFaq} />
    </Animated.View>
  );
}
