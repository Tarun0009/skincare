import { useReminderSync } from '../hooks/useReminderSync';

/**
 * Zero-render component that mounts `useReminderSync` at the app root so
 * notifee's schedule is validated on every cold boot — not only when the
 * user happens to visit the Profile screen. Keeping the hook call here means
 * the OS-side schedule stays authoritative even if the user hasn't touched
 * settings in weeks.
 */
export function ReminderBootstrap(): null {
  useReminderSync();
  return null;
}
