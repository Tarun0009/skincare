import * as Sentry from '@sentry/react-native';
import { env } from '../config/env';

let initialised = false;

/**
 * Initializes Sentry once, as early in app boot as possible. Safe to call
 * multiple times — repeat calls are no-ops. An empty DSN disables Sentry
 * entirely: init() short-circuits so debug builds and forks without a Sentry
 * account keep running unchanged.
 */
export function initSentry(): void {
  if (initialised) return;
  if (!env.sentryDsn) {
    initialised = true;
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: __DEV__ ? 'development' : 'production',
    // Only forward release-build errors. Dev builds hit reload constantly
    // and would drown out real signal.
    enabled: !__DEV__,
    // No PII — IDs and email stay out of Sentry.
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });

  initialised = true;
}

/**
 * Wraps the root component so React tree errors bubble up to Sentry with a
 * component stack. Falls through to the plain component when Sentry is
 * disabled — no visual side-effect.
 */
export function wrapRootComponent<T>(component: T): T {
  if (!env.sentryDsn) return component;
  return Sentry.wrap(component as unknown as React.ComponentType) as unknown as T;
}

export { Sentry };
