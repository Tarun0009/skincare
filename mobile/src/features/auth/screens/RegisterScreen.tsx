import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { Button, Input, Screen, Text } from '../../../ui/primitives';
import { spacing } from '../../../ui/theme/tokens';
import { useRegisterMutation } from '../api/authApi';
import { setCredentials } from '../state/authSlice';
import type { AuthScreenProps } from '../../../app/navigation/types';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, { isLoading, error }] = useRegisterMutation();

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
      ? ((error.data as { message?: string }).message ?? 'Sign-up failed')
      : error
        ? 'Sign-up failed'
        : undefined;

  const submit = () => {
    if (!email || password.length < 8) return;
    register({ email: email.trim(), password });
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
              Start your baseline
            </Text>
            <Text variant="bodyLg" tone="muted">
              One scan tells you where you stand. Tracking is what tells you if anything is working.
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
              autoComplete="password-new"
              placeholder="At least 8 characters"
              returnKeyType="go"
              onSubmitEditing={submit}
              errorText={errorText}
            />
          </View>

          <View style={{ gap: spacing.lg }}>
            <Button
              label="Create account"
              loading={isLoading}
              onPress={submit}
              disabled={!email || password.length < 8}
            />
            <Button label="Continue as guest" variant="secondary" onPress={continueAsGuest} />
            <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'center' }}>
              <Text variant="label" tone="mauve">
                I already have an account
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
