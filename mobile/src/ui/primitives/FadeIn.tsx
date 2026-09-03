import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  FadeIn as ReanimatedFadeIn,
  FadeInDown as ReanimatedFadeInDown,
} from 'react-native-reanimated';

interface FadeInProps {
  children: ReactNode;
  /** Milliseconds for the fade. Defaults to 350ms — feels quick but not jarring. */
  duration?: number;
  /** Delay before the animation starts. Chain successive sections with 60-90ms gaps. */
  delay?: number;
  /** When true, adds a subtle 8px slide-up as it fades in. */
  slideUp?: boolean;
  style?: ViewStyle;
}

/**
 * Wraps children in an on-mount fade animation. Prefer this over hand-rolling
 * Animated.timing whenever a section should simply appear cleanly. Composable
 * with `slideUp` when the section is a hero-ish block (screen header,
 * primary card) that benefits from a small vertical entrance.
 */
export function FadeIn({ children, duration = 350, delay = 0, slideUp = false, style }: FadeInProps) {
  const entering = slideUp
    ? ReanimatedFadeInDown.duration(duration).delay(delay).damping(20).stiffness(140)
    : ReanimatedFadeIn.duration(duration).delay(delay);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}
