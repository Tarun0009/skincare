type Env = {
  apiBaseUrl: string;
  /**
   * Sentry DSN — public identifier, safe to ship in the app bundle. Leave
   * as an empty string to disable Sentry entirely (init() becomes a no-op).
   */
  sentryDsn: string;
};

const dev: Env = {
  // `npm run android`/ADB development uses reverse port forwarding so the
  // same URL works on emulators and physical Android devices.
  apiBaseUrl: 'http://localhost:8080',
  sentryDsn: '',
};

const prod: Env = {
  apiBaseUrl: 'https://selfcare-server.onrender.com',
  sentryDsn: 'https://eedffaa0bfd166af07558cbbaaab60e2@o4512021293236224.ingest.de.sentry.io/4512021659582544',
};

export const env: Env = __DEV__ ? dev : prod;
