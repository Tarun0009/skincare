import { View, type ViewStyle } from 'react-native';
import { palette } from '../theme/tokens';
import { Text } from './Text';

interface CircleIconProps {
  glyph?: string;
  size?: number;
  bg?: string;
  fg?: string;
  border?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * A round chit used everywhere in the design — for checkmarks, back arrows,
 * step numbers. The glyph is a single character (a checkmark, arrow, etc).
 */
export function CircleIcon({
  glyph,
  size = 34,
  bg = 'transparent',
  fg = palette.text,
  border,
  style,
  children,
}: CircleIconProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: border ? 1 : 0,
          borderColor: border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {children ??
        (glyph ? (
          <Text style={{ color: fg, fontSize: size * 0.42, lineHeight: size * 0.42 }}>
            {glyph}
          </Text>
        ) : null)}
    </View>
  );
}
