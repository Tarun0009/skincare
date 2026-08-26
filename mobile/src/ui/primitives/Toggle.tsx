import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { palette } from '../theme/tokens';

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ value, onChange }: ToggleProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [anim, value]);

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(242,237,228,0.14)', palette.sage],
  });
  const translate = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 20] });

  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8}>
      <Animated.View
        style={{
          width: 44,
          height: 27,
          borderRadius: 999,
          backgroundColor: bg,
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            width: 21,
            height: 21,
            borderRadius: 999,
            backgroundColor: '#fff',
            transform: [{ translateX: translate }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
