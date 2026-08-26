import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { ConditionType } from '@shared/types';

export type RootStackParamList = {
  AuthStack: undefined;
  Quiz: undefined;
  MainTabs: undefined;
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

export type MainTabsParamList = {
  Home: undefined;
  Capture: undefined;
  Routine: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type TabScreenProps<T extends keyof MainTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
