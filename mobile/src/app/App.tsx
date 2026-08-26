import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import { StatusBar } from 'react-native';
import { store } from '../store';
import { ThemeProvider } from '../ui/theme/ThemeProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { AuthGate } from './AuthGate';

export function App() {
  return (
    <ReduxProvider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar barStyle="light-content" />
          <NavigationContainer>
            <AuthGate>
              <RootNavigator />
            </AuthGate>
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </ReduxProvider>
  );
}
