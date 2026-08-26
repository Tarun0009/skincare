import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../../features/analysis/screens/HomeScreen';
import { CaptureScreen } from '../../features/capture/screens/CaptureScreen';
import { RoutineScreen } from '../../features/routine/screens/RoutineScreen';
import { HistoryScreen } from '../../features/history/screens/HistoryScreen';
import { ProfileScreen } from '../../features/auth/screens/ProfileScreen';
import { BottomTabBar } from './BottomTabBar';
import type { MainTabsParamList } from './types';

const Tabs = createBottomTabNavigator<MainTabsParamList>();

export function MainTabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Capture" component={CaptureScreen} />
      <Tabs.Screen name="Routine" component={RoutineScreen} />
      <Tabs.Screen name="History" component={HistoryScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}
