import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Button, Input, Screen, Text } from '../../../ui/primitives';
import { spacing } from '../../../ui/theme/tokens';
import { createAccountWithEmail, friendlyAuthError } from '../lib/firebase';
import type { AuthScreenProps } from '../../../app/navigation/types';

const MIN_PASSWORD_LENGTH = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
  confirm?: string;
}

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; confirm?: boolean }>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [remoteError, setRemoteError] = useState<string | undefined>();

  const errors = useMemo<FieldErrors>(() => {
    const e: FieldErrors = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(trimmedEmail)) e.email = 'Enter a valid email address.';

    if (!password) e.password = 'Password is required.';
    else if (password.length < MIN_PASSWORD_LENGTH)
      e.password = `At least ${MIN_PASSWORD_LENGTH} characters.`;

    if (!confirm) e.confirm = 'Confirm your password.';
    else if (confirm !== password) e.confirm = 'Passwords do not match.';

    return e;
  }, [email, password, confirm]);

  const isValid = !errors.email && !errors.password && !errors.confirm;

  const submit = async () => {
    setTouched({ email: true, password: true, confirm: true });
    if (!isValid) return;
    setSubmitting(true);
    setRemoteError(undefined);
    try {
      await createAccountWithEmail(email.trim(), password);
      // onAuthStateChanged pushes the new user into Redux; RootNavigator swaps
      // us onto the Quiz screen from there.
    } catch (e) {
      setRemoteError(friendlyAuthError((e as { code?: string }).code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} style={{ paddingHorizontal: spacing.xxl }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: spacing.xxl }}
        >
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
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@somewhere.com"
              returnKeyType="next"
              errorText={touched.email ? errors.email : undefined}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              secureTextEntry
              passwordToggle
              autoComplete="password-new"
              textContentType="newPassword"
              placeholder="At least 6 characters"
              returnKeyType="next"
              errorText={touched.password ? errors.password : undefined}
            />
            <Input
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              secureTextEntry
              passwordToggle
              autoComplete="password-new"
              textContentType="newPassword"
              placeholder="Re-enter your password"
              returnKeyType="go"
              onSubmitEditing={submit}
              errorText={touched.confirm ? errors.confirm : undefined}
            />
            {remoteError && (
              <Text variant="caption" style={{ color: '#D4674A' }}>
                {remoteError}
              </Text>
            )}
          </View>

          <View style={{ gap: spacing.lg }}>
            <Button
              label="Create account"
              loading={submitting}
              onPress={submit}
              disabled={!isValid || submitting}
            />
            <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'center' }}>
              <Text variant="label" tone="mauve">
                I already have an account
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
