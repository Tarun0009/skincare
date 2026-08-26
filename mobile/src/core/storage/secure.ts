import * as Keychain from 'react-native-keychain';

const AUTH_KEY = 'selfcare.auth';

export interface StoredAuth {
  token: string;
  userId: string;
  email: string;
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
};
