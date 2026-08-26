import { View, type ViewProps, type ViewStyle } from 'react-native';
import { palette, radii, spacing } from '../theme/tokens';

type Tone = 'default' | 'subtle' | 'elevated' | 'dashed' | 'highlight' | 'mauve';

interface CardProps extends ViewProps {
  tone?: Tone;
  padding?: number;
  radius?: keyof typeof radii;
}

const toneStyle: Record<Tone, ViewStyle> = {
  default: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  subtle: {
    backgroundColor: palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  elevated: {
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(232,220,196,0.3)',
  },
  dashed: {
    backgroundColor: palette.surfaceSubtle,
    borderWidth: 1,
    borderColor: 'rgba(242,237,228,0.12)',
    borderStyle: 'dashed',
  },
  highlight: {
    backgroundColor: 'rgba(232,220,196,0.06)',
  },
  mauve: {
    backgroundColor: 'rgba(176,100,141,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(176,100,141,0.25)',
  },
};

export function Card({
  tone = 'default',
  padding = spacing.lg,
  radius = 'lg',
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        toneStyle[tone],
        { borderRadius: radii[radius], padding },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
