import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Card, Divider, FadeIn, Screen, Skeleton, SkeletonCard, Text } from '../../../ui/primitives';
import { palette, spacing } from '../../../ui/theme/tokens';
import { useCompareLatestQuery, useListScansQuery } from '../../analysis/api/scansApi';
import { BeforeAfterPanel } from '../../analysis/components/BeforeAfterPanel';
import { CONDITION_LABEL, type ConditionType } from '@shared/types';
import type { TabScreenProps } from '../../../app/navigation/types';

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

const CONDITION_ORDER: ConditionType[] = [
  'acne',
  'pigmentation',
  'wrinkles',
  'dryness',
  'redness',
];

export function HistoryScreen(_props: TabScreenProps<'History'>) {
  const { data: list, isLoading: isListLoading } = useListScansQuery();
  const { data: comparison, isLoading: isComparisonLoading } = useCompareLatestQuery();

  const scans = useMemo(() => list?.scans ?? [], [list?.scans]);
  const weeksBetween = useMemo(() => {
    const first = scans[scans.length - 1];
    const last = scans[0];
    if (!first || !last || scans.length < 2) return null;
    const earliest = new Date(first.createdAt).getTime();
    const latestTs = new Date(last.createdAt).getTime();
    const weeks = Math.max(1, Math.round((latestTs - earliest) / (7 * 24 * 3600 * 1000)));
    return weeks;
  }, [scans]);

  if (isListLoading) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl, gap: spacing.lg }}>
        <Skeleton width="60%" height={30} />
        <Skeleton width="40%" height={14} />
        <SkeletonCard height={222} />
        <SkeletonCard height={140} />
      </Screen>
    );
  }

  if (scans.length === 0) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
        <View style={{ paddingTop: spacing.xxxl }}>
          <Text variant="h1">Not enough history yet</Text>
          <Text variant="body" tone="muted" style={{ marginTop: spacing.sm }}>
            Take your first scan and you'll see it show up here. Progress starts to mean
            something after your second scan.
          </Text>
        </View>
      </Screen>
    );
  }

  const first = scans[scans.length - 1];
  const latest = scans[0];
  if (!first || !latest) return null;
  const points = [...scans].reverse().map((s) => s.overallScore);
  const dateLabels = [...scans].reverse().map((s) =>
    new Date(s.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  );

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <FadeIn slideUp>
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.sm }}>
            <Text variant="labelSm" tone="dim" upper>
              Progress
            </Text>
            <Text variant="h1" style={{ marginTop: spacing.sm }}>
              {weeksBetween ? `${weeksBetween} week${weeksBetween === 1 ? '' : 's'}` : 'One scan'}
            </Text>
            <Text variant="bodySm" tone="dim" style={{ marginTop: spacing.sm }}>
              {scans.length} scan{scans.length === 1 ? '' : 's'} · same lighting, same angle
            </Text>
          </View>
        </FadeIn>

        {/* Before/After panel — real photos from Cloudinary */}
        {scans.length >= 2 && (
          <FadeIn delay={100}>
            <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
              <BeforeAfterPanel
                before={{
                  photoUrl: first.thumbnailUrl,
                  dateLabel: formatShortDate(first.createdAt),
                  scoreLabel: String(first.overallScore),
                }}
                after={{
                  photoUrl: latest.thumbnailUrl,
                  dateLabel: formatShortDate(latest.createdAt),
                  scoreLabel: String(latest.overallScore),
                }}
              />
            </View>
          </FadeIn>
        )}

        {/* Overall score card + sparkline */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xl }}>
          <Card padding={spacing.lg}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: spacing.md,
              }}
            >
              <Text variant="labelSm" tone="dim" upper>
                Overall score
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
                <Text variant="numeric">
                  {latest.overallScore}
                </Text>
                {comparison && (
                  <Text
                    variant="label"
                    tone={comparison.improvementScore >= 0 ? 'sage' : 'coral'}
                  >
                    {comparison.improvementScore >= 0 ? '+' : ''}
                    {comparison.improvementScore}
                  </Text>
                )}
              </View>
            </View>
            <Sparkline points={points} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: spacing.xs,
              }}
            >
              {dateLabels.map((d, i) => (
                <Text key={i} variant="tiny" tone="faint" upper style={{ letterSpacing: 1 }}>
                  {d}
                </Text>
              ))}
            </View>
          </Card>
        </View>

        {/* Per-condition deltas */}
        {isComparisonLoading && (
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, gap: spacing.md }}>
            <SkeletonCard height={44} />
            <SkeletonCard height={44} />
          </View>
        )}
        {comparison && (
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.lg }}>
            <View>
              {CONDITION_ORDER.map((type, i) => {
                const delta = comparison.perConditionDelta[type];
                if (delta === undefined) return null;
                const tone = delta < -10 ? 'sage' : delta > 10 ? 'coral' : 'muted';
                const sign = delta > 0 ? '+' : '';
                return (
                  <View key={type}>
                    {i > 0 && <Divider />}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 14,
                      }}
                    >
                      <Text variant="labelLg">{CONDITION_LABEL[type]}</Text>
                      <Text
                        variant="label"
                        tone={tone as 'sage' | 'coral' | 'muted'}
                      >
                        {sign}
                        {delta}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            {comparison.narrative && (
              <Text variant="caption" tone="dim" style={{ paddingTop: spacing.md }}>
                {comparison.narrative}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <View style={{ height: 72, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" tone="dim">
          One data point — take another scan to see the trend.
        </Text>
      </View>
    );
  }
  const width = 300;
  const height = 72;
  const minY = Math.min(...points) - 4;
  const maxY = Math.max(...points) + 4;
  const span = Math.max(1, maxY - minY);
  const stepX = width / (points.length - 1);
  const coords = points
    .map((p, i) => `${(i * stepX).toFixed(0)},${((1 - (p - minY) / span) * (height - 12) + 6).toFixed(0)}`)
    .join(' ');
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Polyline points={coords} fill="none" stroke={palette.mauve} strokeWidth={2.5} strokeLinecap="round" />
      {points.map((p, i) => {
        const cx = i * stepX;
        const cy = (1 - (p - minY) / span) * (height - 12) + 6;
        const last = i === points.length - 1;
        return (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={last ? 5.5 : 4}
            fill={last ? palette.cream : palette.mauve}
          />
        );
      })}
    </Svg>
  );
}
