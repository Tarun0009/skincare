import * as Sentry from '@sentry/node';
import { config } from '../config.js';

/**
 * Initializes Sentry as soon as this module is imported. Called from server.ts
 * BEFORE Fastify is instantiated, because Sentry needs to hook Node's global
 * error handlers before any request handling starts.
 *
 * A missing DSN is treated as "disabled" — the SDK becomes a no-op, so local
 * dev without a Sentry account still runs cleanly.
 */
export function initSentry(): void {
  if (!config.observability.sentryDsn) {
    // eslint-disable-next-line no-console
    console.info('[sentry] no DSN configured — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: config.observability.sentryDsn,
    environment: config.env,
    tracesSampleRate: config.observability.tracesSampleRate,
    // Never ship user PII: strip request headers Sentry auto-captures.
    sendDefaultPii: false,
  });
}

export { Sentry };
