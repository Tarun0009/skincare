import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

/**
 * On-device routine reminders for the AM + PM routines. We deliberately use
 * local notifications (not FCM) — the routine is on-device data, the trigger
 * is a fixed time each day, and this keeps us off the push-token treadmill.
 *
 * Contract:
 *  - `ensureScheduled` is idempotent: it cancels existing reminders and
 *    reschedules against the current preference values. Called on app boot
 *    (after auth hydrates) and after the user changes any reminder setting.
 *  - `cancelAll` removes both the AM and PM reminders atomically.
 *  - `requestPermission` returns whether the user granted notifications.
 */

const CHANNEL_ID = 'routine-reminders';
const AM_ID = 'routine-am';
const PM_ID = 'routine-pm';

interface EnsureScheduledInput {
  amEnabled: boolean;
  amHour: number;
  amMinute: number;
  pmEnabled: boolean;
  pmHour: number;
  pmMinute: number;
}

async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Routine reminders',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Compute the next occurrence of a wall-clock time from now. If the time has
 * already passed today we schedule for tomorrow so the first fire is always
 * in the future (notifee rejects past timestamps).
 */
function nextTimestampFor(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime();
}

async function scheduleReminder(
  id: string,
  title: string,
  body: string,
  hour: number,
  minute: number
): Promise<void> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: nextTimestampFor(hour, minute),
    // Fire every day at this time. notifee handles DST rollovers.
    repeatFrequency: RepeatFrequency.DAILY,
    alarmManager: { allowWhileIdle: true },
  };
  await notifee.createTriggerNotification(
    {
      id,
      title,
      body,
      android: {
        channelId: CHANNEL_ID,
        pressAction: { id: 'default', launchActivity: 'default' },
        smallIcon: 'ic_launcher',
      },
    },
    trigger
  );
}

export async function ensureScheduled(input: EnsureScheduledInput): Promise<void> {
  await ensureChannel();
  // Cancel-then-recreate is simpler than diffing existing triggers, and
  // notifee's schedule is a small set (2 entries) — the cost is negligible.
  await notifee.cancelTriggerNotification(AM_ID).catch(() => undefined);
  await notifee.cancelTriggerNotification(PM_ID).catch(() => undefined);

  if (input.amEnabled) {
    await scheduleReminder(
      AM_ID,
      'Morning routine',
      'Two minutes to your AM steps. SPF is the biggest lever.',
      input.amHour,
      input.amMinute
    );
  }
  if (input.pmEnabled) {
    await scheduleReminder(
      PM_ID,
      'Evening routine',
      'Time to wind down — tap to check off tonight.',
      input.pmHour,
      input.pmMinute
    );
  }
}

export async function cancelAll(): Promise<void> {
  await notifee.cancelTriggerNotification(AM_ID).catch(() => undefined);
  await notifee.cancelTriggerNotification(PM_ID).catch(() => undefined);
}
