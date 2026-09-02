import { Pressable, View } from 'react-native';
import { Text } from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';

interface Preset {
  hour: number;
  minute: number;
  label: string;
}

interface ReminderTimeRowProps {
  title: string;
  presets: readonly Preset[];
  selectedHour: number;
  selectedMinute: number;
  onSelect: (hour: number, minute: number) => void;
  disabled?: boolean;
}

/**
 * Compact preset-time picker used for the AM/PM reminder rows. Avoids adding
 * a native date/time picker native dep just to expose four times each side.
 * Reuses the existing pill styling seen elsewhere (Products filters, quiz
 * chips) so it drops into the design system without a new token.
 */
export function ReminderTimeRow({
  title,
  presets,
  selectedHour,
  selectedMinute,
  onSelect,
  disabled,
}: ReminderTimeRowProps) {
  return (
    <View style={{ padding: 16, gap: spacing.md, opacity: disabled ? 0.4 : 1 }}>
      <Text variant="labelLg">{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {presets.map((p) => {
          const isSelected = p.hour === selectedHour && p.minute === selectedMinute;
          return (
            <Pressable
              key={`${p.hour}-${p.minute}`}
              onPress={() => !disabled && onSelect(p.hour, p.minute)}
              disabled={disabled}
              hitSlop={6}
            >
              <View
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: radii.pill,
                  backgroundColor: isSelected ? palette.cream : 'rgba(242,237,228,0.06)',
                }}
              >
                <Text
                  variant="tiny"
                  style={{ color: isSelected ? palette.bg : palette.textMuted }}
                >
                  {p.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
