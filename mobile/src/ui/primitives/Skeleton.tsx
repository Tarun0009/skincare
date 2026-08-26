import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { palette, radii } from '../theme/tokens';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Pulsing surface block used while data loads. All screens with async data
 * should render a skeleton with the same shape as their real content so the
 * layout doesn't shift when it arrives.
 */
export function Skeleton({ width = '100%', height = 14, radius = 6, style }: SkeletonProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, [anim]);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(242,237,228,0.06)', 'rgba(242,237,228,0.12)'],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius: radius,
          backgroundColor: bg,
        },
        style,
      ]}
    />
  );
}

/** Rounded-corner circle block for avatars / progress rings. */
export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

/** Card-shaped block matching the app's default surface. */
export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <View
      style={{
        height,
        borderRadius: radii.lg,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.hairline,
      }}
    />
  );
}
