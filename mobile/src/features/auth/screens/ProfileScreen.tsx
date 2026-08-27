import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useDispatch } from 'react-redux';
import RNFS from 'react-native-fs';
import {
  Card,
  CircleIcon,
  Divider,
  IconChevronRight,
  Screen,
  Skeleton,
  Text,
  Toggle,
} from '../../../ui/primitives';
import { palette, spacing } from '../../../ui/theme/tokens';
import { useAppSelector } from '../../../core/hooks/redux';
import { scanFileStore } from '../../../core/native/fs';
import { logout } from '../state/authSlice';
import { signOutCurrentUser } from '../lib/firebase';
import { setPreference } from '../../preferences/state/preferencesSlice';
import { computeStreak } from '../../adherence/state/adherenceSlice';
import { useListScansQuery } from '../../analysis/api/scansApi';
import type { TabScreenProps } from '../../../app/navigation/types';

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const dispatch = useDispatch();
  const email = useAppSelector((s) => s.auth.email);
  const preferences = useAppSelector((s) => s.preferences);
  const billing = useAppSelector((s) => s.billing);
  const checks = useAppSelector((s) => s.adherence.checks);
  const { data: list, isLoading: isListLoading } = useListScansQuery();

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
  };

  const totalPhotos = photosOnDevice?.count ?? 0;
  const photosSizeLabel = photosOnDevice ? formatBytes(photosOnDevice.bytes) : null;

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
        {/* Identity */}
        <View
          style={{
            paddingHorizontal: spacing.xxl,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 15,
          }}
        >
          <CircleIcon size={58} bg="#251F19" border={palette.hairlineStrong}>
            <Text variant="h3" tone="muted" style={{ fontSize: 22 }}>
              {initial}
            </Text>
          </CircleIcon>
          <View style={{ flex: 1 }}>
            <Text variant="h3">{displayName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 }}>
              {billing.plan !== 'free' && (
                <View
                  style={{
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: 'rgba(176,100,141,0.18)',
                  }}
                >
                  <Text
                    style={{ color: palette.mauveSoft, fontSize: 9.5, letterSpacing: 0.6, fontWeight: '700' }}
                  >
                    {billing.plan.toUpperCase()}
                  </Text>
                </View>
              )}
              <Text variant="caption" tone="dim">
                {billing.renewsAt
                  ? `Renews ${new Date(billing.renewsAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : 'Free plan'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <Card padding={18}>
            <View style={{ flexDirection: 'row', gap: 22 }}>
              {isListLoading ? (
                <Skeleton width={40} height={22} />
              ) : (
                <Stat n={String(scans.length)} label="Scans" />
              )}
              <Stat n={String(streak)} label="Day streak" />
              {photosOnDevice ? (
                <>
                  <Stat n={String(totalPhotos)} label="Photos" />
                  <Stat n={photosSizeLabel ?? '—'} label="On device" small />
                </>
              ) : (
                <>
                  <Skeleton width={40} height={22} />
                  <Skeleton width={50} height={22} />
                </>
              )}
            </View>
          </Card>
        </View>

        {/* Photos & privacy */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
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

        {/* Subscription */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
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

function Stat({ n, label, small }: { n: string; label: string; small?: boolean }) {
  return (
    <View>
      <Text variant="h3" style={{ fontSize: small ? 20 : 24 }}>
        {n}
      </Text>
      <Text variant="tiny" tone="dim" style={{ marginTop: 6 }}>
        {label}
      </Text>
    </View>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16 }}>
      <View style={{ flex: 1 }}>
        <Text variant="labelLg">{title}</Text>
        {body && (
          <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
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
    <Pressable onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16 }}>
        <View style={{ flex: 1 }}>
          <Text variant="labelLg" tone={destructive ? 'coral' : 'default'}>
            {title}
          </Text>
          {body && (
            <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
              {body}
            </Text>
          )}
        </View>
        <IconChevronRight color={palette.textFaint} />
      </View>
    </Pressable>
  );
}
