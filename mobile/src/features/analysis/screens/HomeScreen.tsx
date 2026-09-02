import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Button,
  Card,
  CircleIcon,
  IconCamera,
  IconCheck,
  IconChevronRight,
  IconLock,
  Screen,
  SkeletonCard,
  Text,
} from '../../../ui/primitives';
import { palette, spacing } from '../../../ui/theme/tokens';
import { useAppSelector } from '../../../core/hooks/redux';
import { useListScansQuery, useGetScanQuery } from '../api/scansApi';
import { computeStreak, computeWeekProgress } from '../../adherence/state/adherenceSlice';
import { useAdherenceSync } from '../../adherence/hooks/useAdherenceSync';
import type { TabScreenProps } from '../../../app/navigation/types';

const RESCAN_CYCLE_DAYS = 28;

interface GreetingInfo {
  partOfDay: 'Morning' | 'Evening';
  label: string;
}

function greetingFor(date: Date): GreetingInfo {
  return date.getHours() < 12
    ? { partOfDay: 'Morning', label: 'Good morning' }
    : { partOfDay: 'Evening', label: 'Evening' };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 3600 * 1000));
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekdayInitial(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'narrow' });
}

export function HomeScreen({ navigation }: TabScreenProps<'Home'>) {
  const email = useAppSelector((s) => s.auth.email);
  const userName = (email ?? '').split('@')[0] || 'you';
  const checks = useAppSelector((s) => s.adherence.checks);
  const { toggleStep } = useAdherenceSync();

  const now = useMemo(() => new Date(), []);
  const g = useMemo(() => greetingFor(now), [now]);
  const todayKey = useMemo(() => toDateKey(now), [now]);
  const doneToday = checks[todayKey] ?? [];

  const { data: scanList } = useListScansQuery();
  const latest = scanList?.scans[0];
  const { data: latestScan, isLoading: isScanLoading } = useGetScanQuery(latest?.id ?? '', {
    skip: !latest,
  });

  const routineSteps = useMemo(() => {
    if (!latestScan) return [];
    return g.partOfDay === 'Morning' ? latestScan.routine.am : latestScan.routine.pm;
  }, [latestScan, g.partOfDay]);

  const streak = useMemo(() => computeStreak(checks, now), [checks, now]);

  const week = useMemo(() => {
    const weekStart = startOfWeek(now);
    const progress = computeWeekProgress(checks, Math.max(1, routineSteps.length), weekStart);
    return progress.map((value, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return { date, value };
    });
  }, [checks, now, routineSteps.length]);

  const rescanDaysLeft = useMemo(() => {
    if (!latest) return null;
    const daysSince = daysBetween(new Date(latest.createdAt), now);
    return Math.max(0, RESCAN_CYCLE_DAYS - daysSince);
  }, [latest, now]);

  // Render FirstRunHome immediately when there are no scans (including while
  // the query is still in flight or if the server is unreachable). This keeps
  // the CTA visible instead of pinning the user on a skeleton indefinitely.
  if (!scanList || scanList.scans.length === 0) {
    return <FirstRunHome greeting={g.label} userName={userName} navigation={navigation} today={now} />;
  }

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <View
          style={{
            paddingHorizontal: spacing.xxl,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="bodySm" tone="dim">
              {formatDate(now)}
            </Text>
            <Text variant="h1" style={{ marginTop: 6 }}>
              {g.label}, {userName}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text variant="h2" tone="cream">
              {String(streak).padStart(2, '0')}
            </Text>
            <Text variant="labelSm" tone="dim" upper style={{ marginTop: 4 }}>
              day streak
            </Text>
          </View>
        </View>

        {/* Week bars */}
        <View
          style={{
            paddingHorizontal: spacing.xxl,
            marginTop: spacing.xxl,
            flexDirection: 'row',
            gap: 6,
          }}
        >
          {week.map(({ date, value }) => {
            const isToday = toDateKey(date) === todayKey;
            const bg =
              value >= 0.99
                ? 'rgba(147,168,122,0.7)'
                : value >= 0.5
                  ? 'rgba(217,162,63,0.55)'
                  : value > 0
                    ? 'rgba(217,162,63,0.3)'
                    : 'rgba(242,237,228,0.06)';
            return (
              <View key={date.toISOString()} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                <Text variant="caption" tone={isToday ? 'cream' : 'dim'}>
                  {weekdayInitial(date)}
                </Text>
                <View
                  style={{
                    width: '100%',
                    height: 34,
                    borderRadius: 9,
                    backgroundColor: isToday ? 'rgba(232,220,196,0.16)' : bg,
                    borderWidth: isToday ? 1.5 : 0,
                    borderColor: palette.cream,
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* Tonight/Morning steps */}
        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.xxxl }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text variant="labelSm" tone="dim" upper>
              {g.partOfDay === 'Morning' ? 'This morning' : 'Tonight'} · {routineSteps.length} steps
            </Text>
            <Text variant="caption" tone="dim">
              {g.partOfDay === 'Morning' ? 'Evening ahead' : 'Morning done'}
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {isScanLoading &&
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={64} />)}
            {!isScanLoading && routineSteps.length === 0 && (
              <Card tone="dashed">
                <Text tone="muted">Your latest scan hasn't returned a routine yet.</Text>
              </Card>
            )}
            {!isScanLoading &&
              routineSteps.map((step, idx) => {
                const stepId = `${todayKey}-${g.partOfDay}-${idx}`;
                const done = doneToday.includes(stepId);
                return (
                  <Pressable
                    key={stepId}
                    onPress={() => toggleStep(todayKey, stepId)}
                  >
                    <Card tone={done ? 'default' : 'elevated'} padding={16}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 999,
                            backgroundColor: done ? palette.sage : 'transparent',
                            borderWidth: done ? 0 : 2,
                            borderColor: palette.cream,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {done && <IconCheck size={12} color={palette.bg} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            variant="labelLg"
                            style={
                              done ? { textDecorationLine: 'line-through', color: palette.textMuted } : undefined
                            }
                          >
                            {step.productName}
                          </Text>
                          {step.reason && !done && (
                            <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
                              {step.reason}
                            </Text>
                          )}
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
          </View>

          {/* Rescan nudge — only when we know the schedule */}
          {rescanDaysLeft !== null && (
            <Pressable onPress={() => navigation.navigate('Capture')}>
              <Card tone="mauve" padding={16} style={{ marginTop: spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" tone="mauve">
                      {rescanDaysLeft === 0
                        ? 'Time for a rescan'
                        : `Rescan in ${rescanDaysLeft} day${rescanDaysLeft === 1 ? '' : 's'}`}
                    </Text>
                    <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
                      Four weeks is the earliest a retinoid shows measurable change.
                    </Text>
                  </View>
                  <IconChevronRight color={palette.mauve} />
                </View>
              </Card>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function FirstRunHome({
  greeting,
  userName,
  navigation,
  today,
}: {
  greeting: string;
  userName: string;
  navigation: TabScreenProps<'Home'>['navigation'];
  today: Date;
}) {
  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <View style={{ paddingHorizontal: spacing.xxl }}>
          <Text variant="bodySm" tone="dim">
            {formatDate(today)}
          </Text>
          <Text variant="h1" style={{ marginTop: 8 }}>
            {greeting}, {userName}
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, gap: spacing.lg }}>
          <Card
            tone="default"
            padding={spacing.xxl}
            style={{
              borderColor: 'rgba(176,100,141,0.28)',
              backgroundColor: '#1F1A22',
              gap: 18,
            }}
          >
            <CircleIcon size={52} bg="rgba(176,100,141,0.16)" style={{ borderRadius: 15 }}>
              <IconCamera color={palette.mauveSoft} />
            </CircleIcon>
            <View>
              <Text variant="h3" style={{ marginBottom: 7 }}>
                No baseline yet
              </Text>
              <Text variant="body" tone="muted">
                Your first scan takes about 40 seconds and becomes the reference every later scan
                is measured against.
              </Text>
            </View>
            <Button label="Take your first scan" onPress={() => navigation.navigate('Capture')} />
          </Card>

          <Text variant="labelSm" tone="faint" upper style={{ marginTop: spacing.sm }}>
            Unlocks after your first scan
          </Text>

          {[0, 1].map((i) => (
            <Card key={i} tone="dashed" padding={20}>
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: 'rgba(242,237,228,0.05)',
                  }}
                />
                <View style={{ flex: 1, gap: 8 }}>
                  <View
                    style={{
                      height: 11,
                      width: 120,
                      borderRadius: 3,
                      backgroundColor: 'rgba(242,237,228,0.1)',
                    }}
                  />
                  <View
                    style={{
                      height: 9,
                      width: 170,
                      borderRadius: 3,
                      backgroundColor: 'rgba(242,237,228,0.06)',
                    }}
                  />
                </View>
              </View>
            </Card>
          ))}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: spacing.xs }}>
            <IconLock />
            <Text variant="caption" tone="dim">
              Photos are written to app-private storage on this device only.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
