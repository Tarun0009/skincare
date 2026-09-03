import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { ConditionType } from '@shared/types';

// Declared before RootStackParamList so the nested-navigator param below can
// reference it via NavigatorScreenParams<MainTabsParamList>.
export type MainTabsParamList = {
  Home: undefined;
  Capture: undefined;
  Routine: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  AuthStack: undefined;
  Quiz: undefined;
  // Nested navigator — callers can jump to a specific tab via
  // `navigation.navigate('MainTabs', { screen: 'Routine' })`.
  MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
  Analyzing: { photo: { uri: string; fileName: string; type: string } };
  ScanResult: { scanId: string };
  ConditionDetail: { scanId: string; conditionType: ConditionType };
  Comparison: undefined;
  Products: undefined;
  Paywall: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
