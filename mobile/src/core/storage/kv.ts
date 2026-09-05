import { MMKV } from 'react-native-mmkv';

/**
 * MMKV keyed store for non-sensitive local state (last-used camera, feature
 * flags, cached UI prefs). Never put tokens or PII here — use secure storage.
 */
export const kv = new MMKV({ id: 'selfcare.kv' });

export const KV_KEYS = {
  lastRoutineDismissedAt: 'lastRoutineDismissedAt',
} as const;
