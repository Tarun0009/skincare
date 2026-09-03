import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Button, FadeIn, Input, Screen, Text } from '../../../ui/primitives';
import { spacing } from '../../../ui/theme/tokens';
import { signInWithEmail, friendlyAuthError } from '../lib/firebase';
import type { AuthScreenProps } from '../../../app/navigation/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [submitting, setSubmitting] = useState(false);
  const [remoteError, setRemoteError] = useState<string | undefined>();

  const errors = useMemo(() => {
    const e: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(trimmedEmail)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    return e;
  }, [email, password]);

  const isValid = !errors.email && !errors.password;

  const submit = async () => {
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setSubmitting(true);
    setRemoteError(undefined);
    try {
      await signInWithEmail(email.trim(), password);
      // AuthGate's listener flips auth state → RootNavigator swaps stacks.
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
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.xxxl }}>
          <FadeIn slideUp duration={450}>
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
          </FadeIn>

          <FadeIn delay={120} style={{ gap: spacing.lg }}>
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
              autoComplete="password"
              placeholder="Your password"
              returnKeyType="go"
              onSubmitEditing={submit}
              errorText={touched.password ? errors.password : undefined}
            />
            {remoteError && (
              <Text variant="caption" style={{ color: '#D4674A' }}>
                {remoteError}
              </Text>
            )}
          </FadeIn>

          <FadeIn delay={200} style={{ gap: spacing.lg }}>
            <Button label="Sign in" loading={submitting} onPress={submit} disabled={submitting} />
            <Pressable
              onPress={() => navigation.navigate('Register')}
              style={{ alignSelf: 'center' }}
            >
              <Text variant="label" tone="mauve">
                Create an account
              </Text>
            </Pressable>
          </FadeIn>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
