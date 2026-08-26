import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { palette, typography } from '../theme/tokens';

type Variant = keyof typeof typography;

type Tone =
  | 'default'
  | 'muted'
  | 'dim'
  | 'faint'
  | 'cream'
  | 'mauve'
  | 'sage'
  | 'gold'
  | 'coral'
  | 'ink';

const toneColor: Record<Tone, string> = {
  default: palette.text,
  muted: palette.textMuted,
  dim: palette.textDim,
  faint: palette.textFaint,
  cream: palette.cream,
  mauve: palette.mauveSoft,
  sage: palette.sageSoft,
  gold: palette.goldSoft,
  coral: palette.coralSoft,
  ink: palette.bg,
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  upper?: boolean;
  align?: TextStyle['textAlign'];
}

export function Text({
  variant = 'body',
  tone = 'default',
  upper,
  align,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: toneColor[tone] },
        upper && { textTransform: 'uppercase' },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}
