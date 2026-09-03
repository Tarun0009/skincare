import { ScrollView, View } from 'react-native';
import { Card, FadeIn, Screen, Skeleton, SkeletonCard, Text } from '../../../ui/primitives';
import { spacing } from '../../../ui/theme/tokens';
import { useCompareLatestQuery, useGetScanQuery } from '../../analysis/api/scansApi';
import { BeforeAfterPanel } from '../../analysis/components/BeforeAfterPanel';
import { CONDITION_LABEL, type ConditionType } from '@shared/types';
import type { RootScreenProps } from '../../../app/navigation/types';

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function ComparisonScreen(_props: RootScreenProps<'Comparison'>) {
  const { data, isLoading, error } = useCompareLatestQuery();

  // Both queries are keyed by scan ID and RTK Query dedupes, so if the user
  // already viewed either scan from another screen they hit the cache here.
  const { data: baseline } = useGetScanQuery(data?.baselineScanId ?? '', {
    skip: !data?.baselineScanId,
  });
  const { data: latest } = useGetScanQuery(data?.currentScanId ?? '', {
    skip: !data?.currentScanId,
  });

  if (isLoading) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl, gap: spacing.lg }}>
        <Skeleton width="60%" height={30} />
        <Skeleton width="90%" height={16} />
        <SkeletonCard height={222} />
        <SkeletonCard height={110} />
        <SkeletonCard height={200} />
      </Screen>
    );
  }
  if (error || !data) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
        <Text tone="muted">No comparison yet — take a second scan first.</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <View style={{ paddingHorizontal: spacing.xxl, gap: spacing.xl }}>
          <FadeIn slideUp>
            <View style={{ paddingTop: spacing.sm }}>
              <Text variant="labelSm" tone="dim" upper>
                Comparison
              </Text>
              <Text variant="h1" style={{ marginTop: spacing.sm }}>
                Baseline vs. now
              </Text>
              <Text variant="body" tone="muted" style={{ marginTop: spacing.md }}>
                {data.narrative}
              </Text>
            </View>
          </FadeIn>

          <FadeIn delay={100}>
            {baseline && latest ? (
              <BeforeAfterPanel
                before={{
                  photoUrl: baseline.photoUrl,
                  dateLabel: formatShortDate(baseline.createdAt),
                  scoreLabel: String(baseline.analysis.overallScore),
                }}
                after={{
                  photoUrl: latest.photoUrl,
                  dateLabel: formatShortDate(latest.createdAt),
                  scoreLabel: String(latest.analysis.overallScore),
                }}
              />
            ) : (
              <SkeletonCard height={222} />
            )}
          </FadeIn>

          <FadeIn delay={180}>
            <Card padding={spacing.lg}>
              <Text variant="labelSm" tone="dim" upper style={{ marginBottom: spacing.sm }}>
                Overall change
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
                <Text variant="h1">
                  {data.improvementScore >= 0 ? '+' : ''}
                  {data.improvementScore}
                </Text>
                <Text variant="tiny" tone="faint" upper style={{ letterSpacing: 1.2 }}>
                  points
                </Text>
              </View>
            </Card>
          </FadeIn>

          <View style={{ gap: spacing.md }}>
            <Text variant="labelSm" tone="dim" upper>
              Per condition
            </Text>
            {(Object.keys(data.perConditionDelta) as ConditionType[]).map((k) => {
              const delta = data.perConditionDelta[k] ?? 0;
              const tone: 'sage' | 'coral' | 'muted' =
                delta < -10 ? 'sage' : delta > 10 ? 'coral' : 'muted';
              return (
                <View
                  key={k}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text variant="labelLg">{CONDITION_LABEL[k]}</Text>
                  <Text variant="label" tone={tone}>
                    {delta > 0 ? '+' : ''}
                    {delta}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
