import { useEffect } from 'react';
import { secureStorage } from '../core/storage/secure';
import { hydrated } from '../features/auth/state/authSlice';
import { useAppDispatch, useAppSelector } from '../core/hooks/redux';
import { SplashScreen } from './SplashScreen';

/**
 * Reads persisted credentials from the Keychain on cold start and pushes them
 * into the auth slice before children render. Prevents a flash of the Login
 * screen for already-authed users.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector((s) => s.auth.hydrated);

  useEffect(() => {
    (async () => {
      const stored = await secureStorage.loadAuth();
      dispatch(hydrated(stored));
    })();
  }, [dispatch]);

  if (!isHydrated) return <SplashScreen />;
  return <>{children}</>;
}
