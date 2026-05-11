import { type ReactNode, useEffect, useState } from 'react';
import { Modal, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';

type AnimatedModalVariant = 'center' | 'sheet';

type AnimatedModalProps = {
  visible: boolean;
  children: ReactNode;
  variant?: AnimatedModalVariant;
  onRequestClose: () => void;
  onBackdropPress?: () => void;
  backdropStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  disableBackdropPress?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ENTER_MS = 180;
const CENTER_EXIT_MS = 160;
const SHEET_EXIT_MS = 220;

export function AnimatedModal({
  visible,
  children,
  variant = 'center',
  onRequestClose,
  onBackdropPress = onRequestClose,
  backdropStyle,
  contentStyle,
  disableBackdropPress,
}: AnimatedModalProps) {
  const [mounted, setMounted] = useState(visible);
  const exitDuration = variant === 'sheet' ? SHEET_EXIT_MS : CENTER_EXIT_MS;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    if (!mounted) return;

    const timeout = setTimeout(() => setMounted(false), exitDuration);
    return () => clearTimeout(timeout);
  }, [visible, mounted, exitDuration]);

  if (!mounted) return null;

  const contentEntering =
    variant === 'sheet' ? SlideInDown.duration(240) : FadeIn.duration(ENTER_MS);
  const contentExiting =
    variant === 'sheet'
      ? SlideOutDown.duration(exitDuration)
      : FadeOut.duration(exitDuration);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onRequestClose}
    >
      {visible ? (
        <Animated.View
          entering={FadeIn.duration(ENTER_MS)}
          exiting={FadeOut.duration(exitDuration)}
          style={[
            {
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: variant === 'sheet' ? 'flex-end' : 'center',
            },
            backdropStyle,
          ]}
        >
          <Pressable
            disabled={disableBackdropPress}
            onPress={onBackdropPress}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
          />
          <AnimatedPressable
            entering={contentEntering}
            exiting={contentExiting}
            style={contentStyle}
          >
            {children}
          </AnimatedPressable>
        </Animated.View>
      ) : null}
    </Modal>
  );
}
