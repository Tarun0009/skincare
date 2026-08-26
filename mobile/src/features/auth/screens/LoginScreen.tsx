import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { Button, Input, Screen, Text } from '../../../ui/primitives';
import { spacing } from '../../../ui/theme/tokens';
import { useLoginMutation } from '../api/authApi';
import { setCredentials } from '../state/authSlice';
import type { AuthScreenProps } from '../../../app/navigation/types';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();

  const continueAsGuest = () => {
    dispatch(
      setCredentials({
        token: 'dev-guest-token',
        userId: 'dev-guest',
        email: 'guest@local',
      })
    );
  };

  const errorText =
    error && 'data' in error && typeof error.data === 'object' && error.data
      ? ((error.data as { message?: string }).message ?? 'Sign-in failed')
      : error
        ? 'Sign-in failed'
        : undefined;

  const submit = () => {
    if (!email || !password) return;
    login({ email: email.trim(), password });
  };

  return (
    <Screen edges={['top', 'bottom']} style={{ paddingHorizontal: spacing.xxl }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xxl }}>
          <View style={{ gap: spacing.md }}>
            <Text variant="labelSm" tone="mauve" upper>
              Skin Analyzer
            </Text>
            <Text variant="display2" style={{ letterSpacing: -0.6 }}>
              Welcome back
            </Text>
            <Text variant="bodyLg" tone="muted">
              Sign in to see your baseline and pick up where you left off.
            </Text>
          </View>

          <View style={{ gap: spacing.lg }}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@somewhere.com"
              returnKeyType="next"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="At least 8 characters"
              returnKeyType="go"
              onSubmitEditing={submit}
              errorText={errorText}
            />
          </View>

          <View style={{ gap: spacing.lg }}>
            <Button label="Sign in" loading={isLoading} onPress={submit} />
            <Button label="Continue as guest" variant="secondary" onPress={continueAsGuest} />
            <Pressable
              onPress={() => navigation.navigate('Register')}
              style={{ alignSelf: 'center' }}
            >
              <Text variant="label" tone="mauve">
                Create an account
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
