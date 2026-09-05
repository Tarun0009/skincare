import { useEffect } from 'react';
import { subscribeToAuthState } from '../features/auth/lib/firebase';
import { setFirebaseUser } from '../features/auth/state/authSlice';
import { hydrateOnboarding } from '../features/onboarding/state/onboardingSlice';
import { useAppDispatch, useAppSelector } from '../core/hooks/redux';
import { secureStorage } from '../core/storage/secure';
import { ReminderBootstrap } from '../features/preferences/components/ReminderBootstrap';
import { SplashScreen } from './SplashScreen';

/**
 * Subscribes to Firebase's auth state and pushes the current user into the
 * auth slice. First emission (after Firebase warms up) also flips `hydrated`
 * so RootNavigator stops rendering the splash and picks the right stack.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector((s) => s.auth.hydrated);
  const userId = useAppSelector((s) => s.auth.uid);
  const onboardingHydrated = useAppSelector((s) => s.onboarding.hydrated);

  useEffect(() => {
    let active = true;
    let authRevision = 0;
    const unsub = subscribeToAuthState(async (user) => {
      const revision = ++authRevision;
      if (!user) {
        dispatch(hydrateOnboarding(null));
        dispatch(setFirebaseUser(null));
        return;
      }

      const savedOnboarding = await secureStorage.loadOnboarding(user.uid).catch(() => null);
      if (!active || revision !== authRevision) return;
      // Hydrate onboarding before exposing the authenticated user so the
      // navigator never flashes the quiz for an already-completed account.
      dispatch(hydrateOnboarding(savedOnboarding));
      dispatch(
        setFirebaseUser({ uid: user.uid, email: user.email })
      );
    });
    return () => {
      active = false;
      unsub();
    };
  }, [dispatch]);

  if (!isHydrated || (userId !== null && !onboardingHydrated)) return <SplashScreen />;
  return (
    <>
      <ReminderBootstrap />
      {children}
    </>
  );
}
