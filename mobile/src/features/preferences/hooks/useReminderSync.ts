import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/hooks/redux';
import {
  cancelAll,
  ensureScheduled,
  hasNotificationPermission,
  requestNotificationPermission,
} from '../../../core/notifications/reminders';
import { setPreference } from '../state/preferencesSlice';

/**
 * Keeps notifee's schedule in sync with the reminder preferences in Redux.
 * Two responsibilities:
 *
 *  1. On mount, if reminders are enabled we call `ensureScheduled` once so the
 *     app-boot state matches the user's preference. Idempotent — safe if the
 *     schedule is already correct.
 *  2. Expose a `setEnabled` that requests OS permission first, then persists
 *     the toggle. Rejects the enable if the user denies permission so we
 *     don't end up with a stuck "on" toggle that never fires.
 *
 * Time changes go through `updateTime` — same idempotent reschedule path.
 */
export function useReminderSync() {
  const dispatch = useAppDispatch();
  const remindersEnabled = useAppSelector((s) => s.preferences.remindersEnabled);
  const amHour = useAppSelector((s) => s.preferences.amHour);
  const amMinute = useAppSelector((s) => s.preferences.amMinute);
  const pmHour = useAppSelector((s) => s.preferences.pmHour);
  const pmMinute = useAppSelector((s) => s.preferences.pmMinute);
  const isSignedIn = useAppSelector((s) => Boolean(s.auth.uid));

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      if (!remindersEnabled) {
        await cancelAll();
        return;
      }
      const granted = await hasNotificationPermission();
      if (!granted) {
        // Permission was revoked from the OS while the app was closed. Flip
        // the toggle off so the UI stays truthful; user can re-enable.
        dispatch(setPreference({ key: 'remindersEnabled', value: false }));
        return;
      }
      await ensureScheduled({
        amEnabled: true,
        amHour,
        amMinute,
        pmEnabled: true,
        pmHour,
        pmMinute,
      });
    })().catch(() => undefined);
  }, [remindersEnabled, amHour, amMinute, pmHour, pmMinute, isSignedIn, dispatch]);

  const setEnabled = useCallback(
    async (next: boolean): Promise<boolean> => {
      if (!next) {
        await cancelAll();
        dispatch(setPreference({ key: 'remindersEnabled', value: false }));
        return true;
      }
      const granted = await requestNotificationPermission();
      if (!granted) return false;
      dispatch(setPreference({ key: 'remindersEnabled', value: true }));
      return true;
    },
    [dispatch]
  );

  return { setEnabled };
}
