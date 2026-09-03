import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Scale factor applied while pressed. Defaults to 0.97 — subtle, premium. */
  scaleTo?: number;
  /** Optional stationary style; combined with the animated transform. */
  style?: ViewStyle;
}

/**
 * Drop-in Pressable that scales down slightly while pressed. Uses reanimated
 * on the UI thread so the animation stays smooth even during heavy JS work.
 * Designed for cards, list rows, and secondary buttons — anywhere a press
 * should feel physical without being loud.
 */
export function PressableScale({
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, {
          duration: 90,
          easing: Easing.out(Easing.quad),
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, {
          duration: 130,
          easing: Easing.out(Easing.cubic),
        });
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
    />
  );
}
