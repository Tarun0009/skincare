import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Card, Screen, SkeletonCard, Text } from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { useListScansQuery, useGetScanQuery } from '../../analysis/api/scansApi';
import type { TabScreenProps } from '../../../app/navigation/types';
import type { RoutineStep } from '@shared/types';

type TimeOfDay = 'am' | 'pm';

const AVG_STEP_MINUTES = 0.75;

export function RoutineScreen({ navigation }: TabScreenProps<'Routine'>) {
  const [tab, setTab] = useState<TimeOfDay>('am');
  const { data: list, isLoading: isListLoading } = useListScansQuery();
  const latest = list?.scans[0];
  const { data: scan, isLoading: isScanLoading } = useGetScanQuery(latest?.id ?? '', {
    skip: !latest,
  });

  const steps = useMemo<RoutineStep[]>(
    () => (scan ? (tab === 'am' ? scan.routine.am : scan.routine.pm) : []),
    [scan, tab]
  );

  // Only skeleton while we have no cached result yet AND the query is in
  // flight. Once we know there's no scan (or the query failed), fall through
  // to the empty state instead of holding the user on a spinner.
  if (isListLoading && !list) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl, gap: spacing.md }}>
        <SkeletonCard height={48} />
        <SkeletonCard height={80} />
        <SkeletonCard height={80} />
        <SkeletonCard height={80} />
      </Screen>
    );
  }

  if (!scan && latest && isScanLoading) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl, gap: spacing.md }}>
        <SkeletonCard height={48} />
        <SkeletonCard height={80} />
        <SkeletonCard height={80} />
      </Screen>
    );
  }

  if (!scan) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
        <Text variant="h2">No routine yet</Text>
        <Text variant="body" tone="muted" style={{ marginTop: spacing.sm }}>
          Your routine appears here after your first scan.
        </Text>
        <Pressable onPress={() => navigation.navigate('Capture')} style={{ marginTop: spacing.xl }}>
          <Text variant="label" tone="mauve">
            Take a scan
          </Text>
        </Pressable>
      </Screen>
    );
  }

  const totalMinutes = Math.max(1, Math.round(steps.length * AVG_STEP_MINUTES));

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.sm }}>
          <Text variant="labelSm" tone="dim" upper>
            Daily
          </Text>
          <Text variant="h1" style={{ marginTop: spacing.sm }}>
            Your routine
          </Text>
          <Text variant="bodySm" tone="dim" style={{ marginTop: spacing.sm }}>
            Built from your latest scan · rescan after four weeks
          </Text>
        </View>

        {/* AM/PM segmented */}
        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.xxl }}>
          <View
            style={{
              flexDirection: 'row',
              padding: spacing.xs,
              borderRadius: radii.md,
              backgroundColor: palette.hairline,
            }}
          >
            <SegTab label="Morning" active={tab === 'am'} onPress={() => setTab('am')} />
            <SegTab label="Evening" active={tab === 'pm'} onPress={() => setTab('pm')} />
          </View>
        </View>

        {/* Warnings */}
        {scan.routine.warnings.length > 0 && (
          <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.lg }}>
            <Card tone="mauve" padding={spacing.lg}>
              <Text variant="labelSm" tone="mauve" upper style={{ marginBottom: spacing.sm }}>
                Heads-up
              </Text>
              {scan.routine.warnings.map((w, i) => (
                <Text key={i} variant="caption" tone="muted">
                  · {w}
                </Text>
              ))}
            </Card>
          </View>
        )}

        {/* Steps */}
        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, gap: spacing.md }}>
          {steps.length === 0 ? (
            <Card tone="dashed" padding={spacing.xl}>
              <Text tone="muted">
                Nothing scheduled for {tab === 'am' ? 'morning' : 'evening'} in this scan.
              </Text>
            </Card>
          ) : (
            <>
              {steps.map((step, i) => (
                <StepCard
                  key={`${step.category}-${i}`}
                  step={step}
                  index={i + 1}
                  isSpfMust={step.category === 'sunscreen' && tab === 'am'}
                />
              ))}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radii.md,
                  backgroundColor: palette.hairline,
                  marginTop: spacing.sm,
                }}
              >
                <Text variant="labelSm" tone="dim" upper>
                  {steps.length} steps · {totalMinutes} min{totalMinutes === 1 ? '' : 's'}
                </Text>
                <Pressable onPress={() => navigation.navigate('Products', { scanId: scan.id })}>
                  <Text variant="labelSm" tone="mauve" upper>
                    Find products
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function SegTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          paddingVertical: 10,
          borderRadius: 9,
          backgroundColor: active ? palette.cream : 'transparent',
          alignItems: 'center',
        }}
      >
        <Text variant="label" style={{ color: active ? palette.bg : palette.textMuted }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function StepCard({ step, index, isSpfMust }: { step: RoutineStep; index: number; isSpfMust: boolean }) {
  const isHighlight = isSpfMust;
  return (
    <Card tone={isHighlight ? 'elevated' : 'default'} padding={spacing.lg}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Text
          variant="numeric"
          style={{
            width: 24,
            color: isHighlight ? palette.cream : palette.textFaint,
          }}
        >
          {index}
        </Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="labelLg" style={{ flexShrink: 1 }}>
              {step.productName}
            </Text>
            {isSpfMust && (
              <View
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 3,
                  borderRadius: radii.xs,
                  backgroundColor: palette.cream,
                }}
              >
                <Text variant="tiny" style={{ color: palette.bg, fontSize: 9, letterSpacing: 1.2 }}>
                  MUST
                </Text>
              </View>
            )}
          </View>
          {step.ingredientsToLookFor.length > 0 && (
            <Text variant="caption" tone="dim" style={{ marginTop: spacing.xs }}>
              {step.ingredientsToLookFor.join(' · ')}
            </Text>
          )}
          {step.reason && (
            <Text
              variant="caption"
              style={{ marginTop: spacing.sm, color: isHighlight ? palette.cream : palette.sageSoft }}
            >
              {step.reason}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}
