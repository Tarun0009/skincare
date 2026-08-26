import { Pressable, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  IconCamera,
  IconHome,
  IconProgress,
  IconRoutine,
  IconUser,
  Text,
} from '../../ui/primitives';
import { palette, spacing } from '../../ui/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabsParamList } from './types';

type TabName = keyof MainTabsParamList;

const LABELS: Record<TabName, string> = {
  Home: 'Today',
  Capture: 'Scan',
  Routine: 'Routine',
  History: 'Progress',
  Profile: 'Me',
};

function TabIcon({ name, active }: { name: TabName; active: boolean }) {
  const color = active ? palette.cream : palette.textDim;
  switch (name) {
    case 'Home':
      return <IconHome size={20} color={color} />;
    case 'Capture':
      return <IconCamera size={20} color={color} />;
    case 'Routine':
      return <IconRoutine size={20} color={color} />;
    case 'History':
      return <IconProgress size={20} color={color} />;
    case 'Profile':
      return <IconUser size={20} color={color} />;
  }
}

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 12),
        paddingHorizontal: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: palette.hairline,
        backgroundColor: '#191612',
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const name = route.name as TabName;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={{ flex: 1, alignItems: 'center', gap: 6 }}
          >
            <TabIcon name={name} active={isFocused} />
            <Text variant="tiny" style={{ color: isFocused ? palette.cream : palette.textDim }}>
              {LABELS[name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
