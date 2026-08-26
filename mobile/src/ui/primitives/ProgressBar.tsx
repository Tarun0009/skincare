import { View } from 'react-native';
import { palette, radii } from '../theme/tokens';

interface ProgressBarProps {
  value: number;
  tone?: 'sage' | 'gold' | 'coral' | 'mauve' | 'cream';
  height?: number;
}

const toneColor = {
  sage: palette.sage,
  gold: palette.gold,
  coral: palette.coral,
  mauve: palette.mauve,
  cream: palette.cream,
} as const;

export function ProgressBar({ value, tone = 'cream', height = 6 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      style={{
        height,
        borderRadius: radii.pill,
        backgroundColor: 'rgba(242,237,228,0.08)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: toneColor[tone],
          borderRadius: radii.pill,
        }}
      />
    </View>
  );
}
