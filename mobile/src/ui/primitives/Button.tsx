import { Pressable, ActivityIndicator, type PressableProps, type ViewStyle } from 'react-native';
import { palette, radii, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  full?: boolean;
  style?: ViewStyle;
}

const variantStyle: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: palette.cream, fg: palette.bg },
  secondary: { bg: 'transparent', fg: palette.text, border: palette.hairlineStrong },
  ghost: { bg: 'transparent', fg: palette.mauveSoft },
  danger: { bg: 'transparent', fg: palette.danger, border: 'rgba(232,145,122,0.3)' },
};

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  full = true,
  style,
  ...rest
}: ButtonProps) {
  const v = variantStyle[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.border ? 1 : 0,
          borderRadius: radii.pill,
          paddingVertical: 17,
          paddingHorizontal: spacing.xxl,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: full ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Text style={[typography.button, { color: v.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}
