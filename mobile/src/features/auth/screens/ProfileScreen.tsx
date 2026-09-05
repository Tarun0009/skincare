import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useDispatch } from 'react-redux';
import RNFS from 'react-native-fs';
import {
  Card,
  CircleIcon,
  Divider,
  FadeIn,
  IconChevronRight,
  PressableScale,
  Screen,
  Skeleton,
  Text,
  Toggle,
} from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { useAppSelector } from '../../../core/hooks/redux';
import { scanFileStore } from '../../../core/native/fs';
import { logout } from '../state/authSlice';
import { signOutCurrentUser } from '../lib/firebase';
import { useDeleteAccountMutation } from '../api/accountApi';
import { setPreference, setReminderTime } from '../../preferences/state/preferencesSlice';
import { useReminderSync } from '../../preferences/hooks/useReminderSync';
import { ReminderTimeRow } from '../../preferences/components/ReminderTimeRow';
import { cancelAll as cancelReminders } from '../../../core/notifications/reminders';
import { computeStreak, resetAdherence } from '../../adherence/state/adherenceSlice';
import { useListScansQuery } from '../../analysis/api/scansApi';
import { secureStorage } from '../../../core/storage/secure';
import type { TabScreenProps } from '../../../app/navigation/types';

const AM_PRESETS = [
  { hour: 7, minute: 0, label: '7:00 AM' },
  { hour: 8, minute: 0, label: '8:00 AM' },
  { hour: 9, minute: 0, label: '9:00 AM' },
  { hour: 10, minute: 0, label: '10:00 AM' },
] as const;

const PM_PRESETS = [
  { hour: 20, minute: 0, label: '8:00 PM' },
  { hour: 21, minute: 0, label: '9:00 PM' },
  { hour: 22, minute: 0, label: '10:00 PM' },
  { hour: 23, minute: 0, label: '11:00 PM' },
] as const;

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const dispatch = useDispatch();
  const userId = useAppSelector((s) => s.auth.uid);
  const email = useAppSelector((s) => s.auth.email);
  const preferences = useAppSelector((s) => s.preferences);
  const billing = useAppSelector((s) => s.billing);
  const checks = useAppSelector((s) => s.adherence.checks);
  const { data: list, isLoading: isListLoading } = useListScansQuery();
  const [deleteAccount, deleteAccountState] = useDeleteAccountMutation();
  const { setEnabled: setRemindersEnabled } = useReminderSync();

  const scans = list?.scans ?? [];
  const streak = useMemo(() => computeStreak(checks, new Date()), [checks]);
  const displayName = (email ?? '').split('@')[0] || 'you';
  const initial = displayName.charAt(0).toUpperCase();

  const [photosOnDevice, setPhotosOnDevice] = useState<{ count: number; bytes: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stats = await countPhotos();
      if (!cancelled) setPhotosOnDevice(stats);
    })();
    return () => {
      cancelled = true;
    };
  }, [scans.length]);

  const doLogout = async () => {
    await signOutCurrentUser().catch(() => undefined);
    dispatch(logout());
    // Wipe local adherence so the next signed-in user hydrates from their
    // own server snapshot, not the previous session's checks.
    dispatch(resetAdherence());
    // Also drop any scheduled reminders — they belong to the previous user.
    await cancelReminders().catch(() => undefined);
  };

  const totalPhotos = photosOnDevice?.count ?? 0;
  const photosSizeLabel = photosOnDevice ? formatBytes(photosOnDevice.bytes) : null;

  const doDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This erases every scan, routine and photo across our servers and Cloudinary, then removes your login. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount().unwrap();
              // Server already dropped the Firebase user, so sign-out is a
              // local cleanup that revokes the cached ID token. It'll fail
              // silently if Firebase reports "user-not-found" — that's fine.
              await signOutCurrentUser().catch(() => undefined);
              if (userId) await secureStorage.clearOnboarding(userId).catch(() => undefined);
              dispatch(logout());
              dispatch(resetAdherence());
              await cancelReminders().catch(() => undefined);
              // No manual navigation: RootNavigator switches to AuthStack
              // when auth.uid clears.
            } catch {
              Alert.alert(
                'Could not delete your account',
                'Something went wrong on our side. Please try again in a moment. If it keeps failing, sign out and reach out to support.'
              );
            }
          },
        },
      ]
    );
  };

  const wipePhotos = () => {
    Alert.alert(
      'Delete all photos?',
      `${totalPhotos} file${totalPhotos === 1 ? '' : 's'} · permanent. Scores are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await scanFileStore.clear();
            const fresh = await countPhotos();
            setPhotosOnDevice(fresh);
          },
        },
      ]
    );
  };

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        {/* HERO — bigger avatar, display-size name, plan chip anchored right */}
        <FadeIn slideUp>
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.sm }}>
            <Text variant="labelSm" tone="dim" upper>
              Account
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.lg,
                marginTop: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: radii.pill,
                  backgroundColor: palette.surfaceElevated,
                  borderWidth: 1,
                  borderColor: palette.hairlineStrong,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="h2" tone="cream">
                  {initial}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h2" numberOfLines={1}>
                  {displayName}
                </Text>
                {email && (
                  <Text variant="caption" tone="dim" numberOfLines={1} style={{ marginTop: spacing.xs }}>
                    {email}
                  </Text>
                )}
              </View>
              {billing.plan !== 'free' && (
                <View
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.pill,
                    backgroundColor: palette.mauveTint,
                    borderWidth: 1,
                    borderColor: palette.mauve,
                  }}
                >
                  <Text
                    variant="tiny"
                    upper
                    style={{ color: palette.mauveSoft, letterSpacing: 1.4 }}
                  >
                    {billing.plan}
                  </Text>
                </View>
              )}
            </View>
            <Text variant="caption" tone="faint" style={{ marginTop: spacing.md }}>
              {billing.renewsAt
                ? `Renews ${new Date(billing.renewsAt).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}`
                : 'Free plan · upgrade for unlimited scans'}
            </Text>
          </View>
        </FadeIn>

        {/* STATS — bank-statement style, dividers between, big serif numerals */}
        <FadeIn delay={100}>
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 0,
              }}
            >
              {isListLoading ? (
                <Skeleton width={40} height={28} />
              ) : (
                <HeroStat n={String(scans.length)} label="Scans" />
              )}
              <StatSpacer />
              <HeroStat n={String(streak)} label="Day streak" tone="mauve" />
              <StatSpacer />
              {photosOnDevice ? (
                <HeroStat n={photosSizeLabel ?? '—'} label="Storage" />
              ) : (
                <Skeleton width={40} height={28} />
              )}
            </View>
          </View>
        </FadeIn>

        {/* Photos & privacy */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.huge }}>
          <Text variant="labelSm" tone="dim" upper style={{ marginBottom: spacing.md }}>
            Photos &amp; privacy
          </Text>
          <Card padding={0}>
            <ToggleRow
              title="Store photos on this device only"
              body="App-private directory, excluded from backups"
              value={preferences.photosOnDeviceOnly}
              onChange={(v) => dispatch(setPreference({ key: 'photosOnDeviceOnly', value: v }))}
            />
            <Divider />
            <ToggleRow
              title="Blur photos in the app switcher"
              value={preferences.blurInAppSwitcher}
              onChange={(v) => dispatch(setPreference({ key: 'blurInAppSwitcher', value: v }))}
            />
            <Divider />
            <ToggleRow
              title="Show model confidence"
              body="Adds a certainty score to each finding"
              value={preferences.showConfidence}
              onChange={(v) => dispatch(setPreference({ key: 'showConfidence', value: v }))}
            />
            <Divider />
            <LinkRow title="Export my data" />
            <Divider />
            <LinkRow
              title="Delete all photos"
              body={`${totalPhotos} file${totalPhotos === 1 ? '' : 's'} · permanent, scores are kept`}
              destructive
              onPress={wipePhotos}
            />
          </Card>
        </View>

        {/* Reminders */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.huge }}>
          <Text variant="labelSm" tone="dim" upper style={{ marginBottom: spacing.md }}>
            Reminders
          </Text>
          <Card padding={0}>
            <ToggleRow
              title="Routine reminders"
              body="Daily AM + PM notifications to check off your steps"
              value={preferences.remindersEnabled}
              onChange={async (v) => {
                const ok = await setRemindersEnabled(v);
                if (!ok && v) {
                  Alert.alert(
                    'Notifications are off',
                    'Enable notifications for SelfCare in your device settings to receive routine reminders.'
                  );
                }
              }}
            />
            {preferences.remindersEnabled && (
              <>
                <Divider />
                <ReminderTimeRow
                  title="Morning"
                  presets={AM_PRESETS}
                  selectedHour={preferences.amHour}
                  selectedMinute={preferences.amMinute}
                  onSelect={(hour, minute) =>
                    dispatch(setReminderTime({ slot: 'am', hour, minute }))
                  }
                />
                <Divider />
                <ReminderTimeRow
                  title="Evening"
                  presets={PM_PRESETS}
                  selectedHour={preferences.pmHour}
                  selectedMinute={preferences.pmMinute}
                  onSelect={(hour, minute) =>
                    dispatch(setReminderTime({ slot: 'pm', hour, minute }))
                  }
                />
              </>
            )}
          </Card>
        </View>

        {/* Subscription */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.huge }}>
          <Text variant="labelSm" tone="dim" upper style={{ marginBottom: spacing.md }}>
            Subscription
          </Text>
          <Card padding={0}>
            <LinkRow
              title={billing.plan === 'free' ? 'Upgrade to Pro' : 'Manage subscription'}
              onPress={() => navigation.navigate('Paywall')}
            />
            <Divider />
            <LinkRow title="Restore purchases" />
          </Card>
        </View>

        {/* Sign out */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <Card padding={0}>
            <LinkRow title="Sign out" destructive onPress={doLogout} />
          </Card>
        </View>

        {/* Delete account — separated so it doesn't feel adjacent to the
            benign "Sign out" affordance. */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <Card padding={0}>
            <LinkRow
              title={deleteAccountState.isLoading ? 'Deleting your account…' : 'Delete account'}
              body="Erases every scan, routine and photo from our servers and removes your login."
              destructive
              onPress={deleteAccountState.isLoading ? undefined : doDeleteAccount}
            />
          </Card>
        </View>

        {/* Disclaimer */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <View
            style={{
              padding: 16,
              borderRadius: 14,
              backgroundColor: 'rgba(242,237,228,0.035)',
            }}
          >
            <Text variant="caption" tone="dim">
              Skin Analyzer provides cosmetic guidance only. It does not diagnose, treat or
              prevent any medical condition. See a licensed dermatologist for anything painful,
              spreading or changing quickly.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

async function countPhotos(): Promise<{ count: number; bytes: number }> {
  const dir = `${RNFS.DocumentDirectoryPath}/scans`;
  const exists = await RNFS.exists(dir);
  if (!exists) return { count: 0, bytes: 0 };
  const files = await RNFS.readDir(dir);
  const bytes = files.reduce((acc, f) => acc + Number(f.size ?? 0), 0);
  return { count: files.length, bytes };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)}KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)}MB`;
}

/**
 * Bank-statement style stat — big serif numeral over a tiny uppercase label.
 * Reserves consistent width so three of them line up cleanly with spacers.
 */
function HeroStat({ n, label, tone }: { n: string; label: string; tone?: 'mauve' }) {
  return (
    <View style={{ flex: 1, alignItems: 'flex-start' }}>
      <Text
        variant="display3"
        style={{ fontSize: 34, color: tone === 'mauve' ? palette.mauveSoft : palette.text }}
      >
        {n}
      </Text>
      <Text
        variant="tiny"
        tone="faint"
        upper
        style={{ marginTop: spacing.xs, letterSpacing: 1.4 }}
      >
        {label}
      </Text>
    </View>
  );
}

/** Thin vertical hairline between stats. */
function StatSpacer() {
  return (
    <View
      style={{
        width: 1,
        height: 32,
        backgroundColor: palette.hairlineStrong,
        marginHorizontal: spacing.lg,
      }}
    />
  );
}

function ToggleRow({
  title,
  body,
  value,
  onChange,
}: {
  title: string;
  body?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
      <View style={{ flex: 1 }}>
        <Text variant="labelLg">{title}</Text>
        {body && (
          <Text variant="caption" tone="dim" style={{ marginTop: spacing.xs }}>
            {body}
          </Text>
        )}
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}

function LinkRow({
  title,
  body,
  destructive,
  onPress,
}: {
  title: string;
  body?: string;
  destructive?: boolean;
  onPress?: () => void;
}) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.985}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Text variant="labelLg" tone={destructive ? 'coral' : 'default'}>
            {title}
          </Text>
          {body && (
            <Text variant="caption" tone="dim" style={{ marginTop: spacing.xs }}>
              {body}
            </Text>
          )}
        </View>
        <IconChevronRight color={palette.textFaint} />
      </View>
    </PressableScale>
  );
}
