import { View, type ViewStyle } from 'react-native';
import { palette, radii, typography } from '../theme/tokens';
import { Text } from './Text';

type Tone = 'neutral' | 'cream' | 'mauve' | 'sage' | 'gold' | 'coral' | 'ghost';

interface ChipProps {
  label: string;
  tone?: Tone;
  dot?: boolean;
  selected?: boolean;
  style?: ViewStyle;
}

const toneMap: Record<Tone, { bg: string; fg: string; border?: string; dot: string }> = {
  neutral: { bg: 'rgba(242,237,228,0.06)', fg: palette.textMuted, dot: palette.textMuted },
  cream: { bg: palette.cream, fg: palette.bg, dot: palette.bg },
  mauve: { bg: palette.mauveTint, fg: palette.mauveSoft, dot: palette.mauve },
  sage: { bg: palette.sageTint, fg: palette.sageSoft, dot: palette.sage },
  gold: { bg: palette.goldTint, fg: palette.goldSoft, border: 'rgba(217,162,63,0.4)', dot: palette.gold },
  coral: { bg: palette.coralTint, fg: palette.coralSoft, border: 'rgba(212,103,74,0.4)', dot: palette.coral },
  ghost: { bg: 'transparent', fg: palette.textDim, dot: palette.textDim },
};

export function Chip({ label, tone = 'neutral', dot, selected, style }: ChipProps) {
  const t = toneMap[tone];
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: radii.pill,
          backgroundColor: t.bg,
          borderWidth: t.border || selected ? 1 : 0,
          borderColor: t.border ?? 'rgba(232,220,196,0.4)',
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            backgroundColor: t.dot,
            marginRight: 6,
          }}
        />
      )}
      <Text style={[typography.tiny, { color: t.fg }]}>{label}</Text>
    </View>
  );
}
