import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';
import { Card, FadeIn, Screen, Skeleton, SkeletonCard, Text } from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
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
        <Skeleton width="40%" height={14} />
        <Skeleton width="70%" height={64} />
        <Skeleton width="60%" height={14} />
        <SkeletonCard height={222} />
        <SkeletonCard height={180} />
      </Screen>
    );
  }

  if (scans.length === 0) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
        <View style={{ paddingTop: spacing.xxxl }}>
          <Text variant="labelSm" tone="dim" upper>Progress</Text>
          <Text variant="h1" style={{ marginTop: spacing.sm }}>Not enough history yet</Text>
          <Text variant="body" tone="muted" style={{ marginTop: spacing.md }}>
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

  const delta = comparison?.improvementScore ?? 0;
  const hasComparison = Boolean(comparison);
  const deltaTone = delta > 0 ? palette.sageSoft : delta < 0 ? palette.coralSoft : palette.textMuted;
  const trendLabel = delta > 0 ? 'Improving' : delta < 0 ? 'Softening' : 'Steady';

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        {/* HERO — the big improvement number is the anchor */}
        <FadeIn slideUp>
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.sm }}>
            <Text variant="labelSm" tone="dim" upper>
              Progress
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginTop: spacing.md,
              }}
            >
              <View>
                {hasComparison ? (
                  <Text variant="display1" style={{ color: deltaTone, letterSpacing: -1.4 }}>
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </Text>
                ) : (
                  <Text variant="display1" tone="cream" style={{ letterSpacing: -1.4 }}>
                    {latest.overallScore}
                  </Text>
                )}
                <Text
                  variant="labelSm"
                  tone="dim"
                  upper
                  style={{ marginTop: spacing.xs }}
                >
                  {hasComparison ? trendLabel : 'Overall score'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="numeric" tone="cream">
                  {latest.overallScore}
                </Text>
                <Text
                  variant="tiny"
                  tone="faint"
                  upper
                  style={{ marginTop: spacing.xxs, letterSpacing: 1.4 }}
                >
                  Now
                </Text>
              </View>
            </View>
            <Text variant="bodySm" tone="dim" style={{ marginTop: spacing.md }}>
              {weeksBetween
                ? `${weeksBetween} week${weeksBetween === 1 ? '' : 's'} · ${scans.length} scan${scans.length === 1 ? '' : 's'}`
                : `${scans.length} scan${scans.length === 1 ? '' : 's'} · take another to see the trend`}
            </Text>
          </View>
        </FadeIn>

        {/* Before/After panel */}
        {scans.length >= 2 && (
          <FadeIn delay={100}>
            <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl }}>
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

        {/* Trend card — bigger, area-filled sparkline */}
        <FadeIn delay={180}>
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
            <Card padding={spacing.lg}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: spacing.lg,
                }}
              >
                <Text variant="labelSm" tone="dim" upper>
                  Trend
                </Text>
                {dateLabels[0] && dateLabels[dateLabels.length - 1] && (
                  <Text variant="tiny" tone="faint" upper style={{ letterSpacing: 1.2 }}>
                    {dateLabels[0]} → {dateLabels[dateLabels.length - 1]}
                  </Text>
                )}
              </View>
              <Sparkline points={points} />
            </Card>
          </View>
        </FadeIn>

        {/* Per-condition — visual delta bars, not a flat list */}
        {isComparisonLoading && (
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl, gap: spacing.md }}>
            <SkeletonCard height={44} />
            <SkeletonCard height={44} />
          </View>
        )}
        {comparison && (
          <FadeIn delay={260}>
            <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxxl }}>
              <Text variant="labelSm" tone="dim" upper style={{ marginBottom: spacing.lg }}>
                Per condition
              </Text>
              <View style={{ gap: spacing.lg }}>
                {CONDITION_ORDER.map((type) => {
                  const conditionDelta = comparison.perConditionDelta[type];
                  if (conditionDelta === undefined) return null;
                  return (
                    <ConditionDeltaBar
                      key={type}
                      label={CONDITION_LABEL[type]}
                      delta={conditionDelta}
                    />
                  );
                })}
              </View>
              {comparison.narrative && (
                <Text
                  variant="body"
                  tone="muted"
                  style={{
                    paddingTop: spacing.xxl,
                    fontStyle: 'italic',
                  }}
                >
                  {comparison.narrative}
                </Text>
              )}
            </View>
          </FadeIn>
        )}
      </ScrollView>
    </Screen>
  );
}

/**
 * A single condition delta rendered as a horizontal bar. The bar sits on a
 * center line; positive deltas fill sage to the left (improvement), negative
 * deltas fill coral to the right (worsened). Percentage text sits at the end
 * of the bar so the eye can compare rows at a glance.
 */
function ConditionDeltaBar({ label, delta }: { label: string; delta: number }) {
  const clamped = Math.max(-100, Math.min(100, delta));
  const isImproved = clamped < 0; // negative severity change = better
  const absPct = Math.min(100, Math.abs(clamped));
  const color = isImproved ? palette.sage : clamped > 0 ? palette.coral : palette.textMuted;
  const softColor = isImproved ? palette.sageSoft : clamped > 0 ? palette.coralSoft : palette.textMuted;

  return (
    <View style={{ gap: spacing.sm }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <Text variant="labelLg">{label}</Text>
        <Text variant="label" style={{ color: softColor }}>
          {delta > 0 ? '+' : ''}
          {delta}%
        </Text>
      </View>
      <View
        style={{
          height: 4,
          borderRadius: radii.pill,
          backgroundColor: palette.hairline,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${absPct}%`,
            backgroundColor: color,
            borderRadius: radii.pill,
          }}
        />
      </View>
    </View>
  );
}

const SPARKLINE_WIDTH = 320;
const SPARKLINE_HEIGHT = 110;

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <View style={{ height: SPARKLINE_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="caption" tone="dim">
          One data point — take another scan to see the trend.
        </Text>
      </View>
    );
  }
  const width = SPARKLINE_WIDTH;
  const height = SPARKLINE_HEIGHT;
  const minY = Math.min(...points) - 4;
  const maxY = Math.max(...points) + 4;
  const span = Math.max(1, maxY - minY);
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: (1 - (p - minY) / span) * (height - 16) + 8,
  }));
  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const firstPoint = coords[0]!;
  const lastPoint = coords[coords.length - 1]!;
  const areaPath = `M ${firstPoint.x},${height} L ${coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ')} L ${lastPoint.x},${height} Z`;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={palette.mauve} stopOpacity={0.35} />
          <Stop offset="1" stopColor={palette.mauve} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#sparkFill)" />
      <Polyline
        points={linePoints}
        fill="none"
        stroke={palette.mauve}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((_, i) => {
        const c = coords[i]!;
        const last = i === points.length - 1;
        return (
          <Circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={last ? 6 : 3.5}
            fill={last ? palette.cream : palette.mauve}
            stroke={last ? palette.mauve : 'none'}
            strokeWidth={last ? 2 : 0}
          />
        );
      })}
    </Svg>
  );
}
