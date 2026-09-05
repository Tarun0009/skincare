import * as Keychain from 'react-native-keychain';

const AUTH_KEY = 'selfcare.auth';
const ONBOARDING_KEY_PREFIX = 'selfcare.onboarding';

export interface StoredAuth {
  token: string;
  userId: string;
  email: string;
}

export interface StoredOnboarding {
  answers: Record<string, string | string[]>;
  completed: boolean;
}

function onboardingService(userId: string): string {
  return `${ONBOARDING_KEY_PREFIX}.${userId}`;
}

function isStoredOnboarding(value: unknown): value is StoredOnboarding {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredOnboarding>;
  return typeof candidate.completed === 'boolean' && Boolean(candidate.answers) &&
    typeof candidate.answers === 'object' && !Array.isArray(candidate.answers);
}

export const secureStorage = {
  async saveAuth(auth: StoredAuth): Promise<void> {
    await Keychain.setGenericPassword(auth.email, JSON.stringify(auth), {
      service: AUTH_KEY,
    });
  },

  async loadAuth(): Promise<StoredAuth | null> {
    const creds = await Keychain.getGenericPassword({ service: AUTH_KEY });
    if (!creds) return null;
    try {
      return JSON.parse(creds.password) as StoredAuth;
    } catch {
      return null;
    }
  },

  async clearAuth(): Promise<void> {
    await Keychain.resetGenericPassword({ service: AUTH_KEY });
  },

  /** Onboarding contains personal skin preferences, so keep it encrypted. */
  async saveOnboarding(userId: string, onboarding: StoredOnboarding): Promise<void> {
    await Keychain.setGenericPassword(userId, JSON.stringify(onboarding), {
      service: onboardingService(userId),
    });
  },

  async loadOnboarding(userId: string): Promise<StoredOnboarding | null> {
    const creds = await Keychain.getGenericPassword({
      service: onboardingService(userId),
    });
    if (!creds) return null;
    try {
      const parsed: unknown = JSON.parse(creds.password);
      return isStoredOnboarding(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  async clearOnboarding(userId: string): Promise<void> {
    await Keychain.resetGenericPassword({ service: onboardingService(userId) });
  },
};
