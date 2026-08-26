import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Screen, Text } from '../ui/primitives';
import { palette, spacing } from '../ui/theme/tokens';

/**
 * Cold-start splash. Shown by AuthGate while we read persisted credentials
 * from the Keychain. Uses the same visual language as Analyzing so the
 * transition into an authed session feels continuous.
 */
export function SplashScreen() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Screen edges={['top', 'bottom']} style={{ paddingHorizontal: spacing.xxl }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              position: 'absolute',
              width: 60,
              height: 76,
              borderTopLeftRadius: 60,
              borderTopRightRadius: 60,
              borderBottomLeftRadius: 50,
              borderBottomRightRadius: 50,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.hairlineStrong,
            }}
          />
          <Animated.View style={{ position: 'absolute', transform: [{ rotate }] }}>
            <Svg width={96} height={96}>
              <Circle
                cx={48}
                cy={48}
                r={44}
                fill="none"
                stroke={palette.mauve}
                strokeWidth={2}
                strokeDasharray="42 220"
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>
        </View>
        <Text variant="labelSm" tone="mauve" upper>
          Skin Analyzer
        </Text>
        <Text variant="h2" align="center">
          Warming up
        </Text>
      </View>
    </Screen>
  );
}
