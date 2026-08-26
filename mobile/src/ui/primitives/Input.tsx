import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { palette, radii, spacing, typography } from '../theme/tokens';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  errorText?: string;
}

export function Input({ label, errorText, onFocus, onBlur, style, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = errorText
    ? palette.danger
    : focused
      ? palette.cream
      : palette.hairlineStrong;

  return (
    <View style={{ gap: spacing.sm }}>
      {label && (
        <Text variant="label" tone="muted" upper style={{ letterSpacing: 1.4, fontSize: 11 }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={palette.textFaint}
        {...rest}
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
            backgroundColor: palette.surface,
            borderColor,
            borderWidth: 1,
            borderRadius: radii.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: 14,
            color: palette.text,
            ...typography.bodyLg,
          },
          style,
        ]}
      />
      {errorText && (
        <Text variant="caption" style={{ color: palette.danger }}>
          {errorText}
        </Text>
      )}
    </View>
  );
}
