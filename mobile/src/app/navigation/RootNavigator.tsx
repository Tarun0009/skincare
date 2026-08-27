import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { MainTabsNavigator } from './MainTabsNavigator';
import { QuizScreen } from '../../features/onboarding/screens/QuizScreen';
import { AnalyzingScreen } from '../../features/analysis/screens/AnalyzingScreen';
import { ScanResultScreen } from '../../features/analysis/screens/ScanResultScreen';
import { ConditionDetailScreen } from '../../features/analysis/screens/ConditionDetailScreen';
import { ComparisonScreen } from '../../features/history/screens/ComparisonScreen';
import { ProductsScreen } from '../../features/products/screens/ProductsScreen';
import { PaywallScreen } from '../../features/billing/screens/PaywallScreen';
import { useAppSelector } from '../../core/hooks/redux';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthed = useAppSelector((s) => Boolean(s.auth.uid));
  const onboardingComplete = useAppSelector((s) => s.onboarding.completed);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthed ? (
        <Stack.Screen name="AuthStack" component={AuthNavigator} />
      ) : !onboardingComplete ? (
        <Stack.Screen name="Quiz" component={QuizScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
          <Stack.Screen name="Analyzing" component={AnalyzingScreen} />
          <Stack.Screen name="ScanResult" component={ScanResultScreen} />
          <Stack.Screen name="ConditionDetail" component={ConditionDetailScreen} />
          <Stack.Screen name="Comparison" component={ComparisonScreen} />
          <Stack.Screen name="Products" component={ProductsScreen} />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{ presentation: 'modal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
