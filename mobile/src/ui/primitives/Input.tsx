import { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { palette, radii, spacing, typography } from '../theme/tokens';
import { IconEye, IconEyeOff } from './Icon';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  errorText?: string;
  /**
   * When true, renders a show/hide toggle on the right. Ignored unless
   * `secureTextEntry` is also set — the toggle is a no-op otherwise.
   */
  passwordToggle?: boolean;
}

export function Input({
  label,
  errorText,
  onFocus,
  onBlur,
  style,
  passwordToggle,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const borderColor = errorText
    ? palette.danger
    : focused
      ? palette.cream
      : palette.hairlineStrong;

  const showToggle = passwordToggle && secureTextEntry;
  const effectiveSecure = secureTextEntry && !revealed;

  return (
    <View style={{ gap: spacing.sm }}>
      {label && (
        <Text variant="label" tone="muted" upper style={{ letterSpacing: 1.4, fontSize: 11 }}>
          {label}
        </Text>
      )}
      <View
        style={{
          backgroundColor: palette.surface,
          borderColor,
          borderWidth: 1,
          borderRadius: radii.md,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TextInput
          placeholderTextColor={palette.textFaint}
          {...rest}
          secureTextEntry={effectiveSecure}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              paddingHorizontal: spacing.lg,
              paddingVertical: 14,
              color: palette.text,
              ...typography.bodyLg,
            },
            style,
          ]}
        />
        {showToggle && (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={{ paddingHorizontal: spacing.lg, paddingVertical: 14 }}
          >
            {revealed ? <IconEyeOff /> : <IconEye />}
          </Pressable>
        )}
      </View>
      {errorText && (
        <Text variant="caption" style={{ color: palette.danger }}>
          {errorText}
        </Text>
      )}
    </View>
  );
}
