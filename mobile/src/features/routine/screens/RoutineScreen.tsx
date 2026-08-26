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

  if (isListLoading || (latest && isScanLoading)) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl, gap: spacing.md }}>
        <SkeletonCard height={48} />
        <SkeletonCard height={80} />
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
        <View style={{ paddingHorizontal: spacing.xxl }}>
          <Text variant="h1">Your routine</Text>
          <Text variant="bodySm" tone="dim" style={{ marginTop: 7 }}>
            Built from your latest scan · rescan after four weeks
          </Text>
        </View>

        {/* AM/PM segmented */}
        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.xl }}>
          <View
            style={{
              flexDirection: 'row',
              padding: 4,
              borderRadius: radii.md,
              backgroundColor: 'rgba(242,237,228,0.06)',
            }}
          >
            <SegTab label="Morning" active={tab === 'am'} onPress={() => setTab('am')} />
            <SegTab label="Evening" active={tab === 'pm'} onPress={() => setTab('pm')} />
          </View>
        </View>

        {/* Warnings */}
        {scan.routine.warnings.length > 0 && (
          <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.lg }}>
            <Card tone="mauve" padding={14}>
              <Text variant="label" tone="mauve" style={{ marginBottom: 6 }}>
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
        <View style={{ paddingHorizontal: spacing.xxl, marginTop: spacing.xl, gap: 12 }}>
          {steps.length === 0 ? (
            <Card tone="dashed" padding={20}>
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
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: radii.md,
                  backgroundColor: 'rgba(242,237,228,0.04)',
                  marginTop: spacing.xs,
                }}
              >
                <Text variant="label" tone="muted">
                  {steps.length} steps · about {totalMinutes} minute{totalMinutes === 1 ? '' : 's'}
                </Text>
                <Pressable onPress={() => navigation.navigate('Products')}>
                  <Text variant="label" tone="mauve">
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
    <Card tone={isHighlight ? 'elevated' : 'default'} padding={16}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Text
          style={{
            width: 26,
            fontSize: 20,
            color: isHighlight ? palette.cream : palette.textDim,
            paddingTop: 2,
          }}
        >
          {index}
        </Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="labelLg" style={{ flexShrink: 1 }}>
              {step.productName}
            </Text>
            {isSpfMust && (
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 5,
                  backgroundColor: palette.cream,
                }}
              >
                <Text style={{ color: palette.bg, fontSize: 9, letterSpacing: 0.6, fontWeight: '700' }}>
                  MUST
                </Text>
              </View>
            )}
          </View>
          {step.ingredientsToLookFor.length > 0 && (
            <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
              {step.ingredientsToLookFor.join(' · ')}
            </Text>
          )}
          {step.reason && (
            <Text
              variant="caption"
              style={{ marginTop: 7, color: isHighlight ? palette.cream : palette.sageSoft }}
            >
              {step.reason}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}
