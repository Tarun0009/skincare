import { useEffect } from 'react';
import { subscribeToAuthState } from '../features/auth/lib/firebase';
import { setFirebaseUser } from '../features/auth/state/authSlice';
import { useAppDispatch, useAppSelector } from '../core/hooks/redux';
import { SplashScreen } from './SplashScreen';

/**
 * Subscribes to Firebase's auth state and pushes the current user into the
 * auth slice. First emission (after Firebase warms up) also flips `hydrated`
 * so RootNavigator stops rendering the splash and picks the right stack.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector((s) => s.auth.hydrated);

  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      dispatch(
        setFirebaseUser(user ? { uid: user.uid, email: user.email } : null)
      );
    });
    return unsub;
  }, [dispatch]);

  if (!isHydrated) return <SplashScreen />;
  return <>{children}</>;
}
