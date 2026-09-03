import { Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import {
  Card,
  Chip,
  CircleIcon,
  FadeIn,
  IconArrowLeft,
  IconChevronRight,
  Screen,
  Skeleton,
  SkeletonCard,
  Text,
} from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { useAppSelector } from '../../../core/hooks/redux';
import { useGetScanQuery } from '../api/scansApi';
import { bucketForSeverity, sortByImpact, type SeverityTone } from '../lib/severity';
import { CONDITION_GUIDANCE } from '../lib/conditionGuidance';
import { CONDITION_LABEL, type FaceRegion } from '@shared/types';
import type { RootScreenProps } from '../../../app/navigation/types';

const REGION_STYLE: Record<FaceRegion, ViewStyle> = {
  forehead: { left: '32%', right: '32%', top: '12%', height: '14%' },
  nose: { left: '42%', right: '42%', top: '38%', height: '14%' },
  cheeks: { left: '8%', top: '44%', width: '26%', height: '22%' },
  chin: { left: '20%', right: '20%', bottom: '8%', height: '34%' },
  jawline: { left: '10%', right: '10%', bottom: '18%', height: '14%' },
};

export function ConditionDetailScreen({ route, navigation }: RootScreenProps<'ConditionDetail'>) {
  const { scanId, conditionType } = route.params;
  const showConfidence = useAppSelector((s) => s.preferences.showConfidence);
  const { data, isLoading } = useGetScanQuery(scanId);

  if (isLoading) return <LoadingDetail onBack={() => navigation.goBack()} />;
  if (!data) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
        <Text tone="muted">This scan is no longer available.</Text>
      </Screen>
    );
  }

  const sorted = sortByImpact(data.analysis.conditions);
  const idx = sorted.findIndex((c) => c.type === conditionType);
  const condition = sorted[idx];

  if (!condition) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
        <Text tone="muted">That finding isn't in this scan.</Text>
      </Screen>
    );
  }

  const bucket = bucketForSeverity(condition.severity);
  const guidance = CONDITION_GUIDANCE[condition.type];

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <CircleIcon size={34} border={palette.hairlineStrong}>
              <IconArrowLeft color={palette.textMuted} />
            </CircleIcon>
          </Pressable>
          <Text variant="labelSm" tone="muted" upper>
            Finding {idx + 1} of {sorted.length}
          </Text>
        </View>

        <FadeIn slideUp>
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Chip tone={bucket.tone} label={bucket.label} />
              {showConfidence && (
                <Text variant="tiny" tone="faint" upper style={{ letterSpacing: 1.2 }}>
                  Confidence {condition.confidence.toFixed(2)}
                </Text>
              )}
            </View>
            <Text variant="h1" style={{ letterSpacing: -0.4 }}>
              {CONDITION_LABEL[condition.type]}
            </Text>
            <Text variant="body" tone="muted" style={{ marginTop: spacing.sm }}>
              {condition.notes || guidance.headline}
            </Text>
          </View>
        </FadeIn>

        {/* Silhouette + affected regions */}
        <View
          style={{
            paddingHorizontal: spacing.xxl,
            paddingTop: spacing.xxl,
            flexDirection: 'row',
            gap: spacing.lg,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 126,
              height: 158,
              borderRadius: 60,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.hairlineStrong,
              overflow: 'hidden',
            }}
          >
            {condition.locations.map((region) => (
              <RegionBlot
                key={region}
                style={REGION_STYLE[region]}
                tone={bucket.tone}
                strong={region === 'chin' || region === 'jawline'}
              />
            ))}
          </View>
          <View style={{ flex: 1, gap: 11 }}>
            <Stat n={String(condition.severity)} label={`${bucket.label} severity`} />
            <Stat n={String(condition.locations.length)} label="Affected regions" />
            <Stat n={condition.confidence.toFixed(2)} label="Model confidence" />
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <Card padding={spacing.lg}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <CircleIcon size={18} border={palette.mauve}>
                <Text variant="tiny" style={{ color: palette.mauve }}>?</Text>
              </CircleIcon>
              <Text variant="labelSm" tone="dim" upper>Why we flagged this</Text>
            </View>
            <Text variant="bodySm" tone="muted">
              {guidance.reason}
            </Text>
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <Text variant="labelSm" tone="dim" upper style={{ marginBottom: spacing.md }}>
            What to target
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {guidance.targets.map((t) => (
              <View
                key={t}
                style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radii.sm,
                  backgroundColor: palette.hairline,
                }}
              >
                <Text variant="caption">{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <Card tone="mauve" padding={spacing.lg}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text variant="label" tone="mauve">
                  See a dermatologist
                </Text>
                <Text variant="caption" tone="dim" style={{ marginTop: spacing.xs }}>
                  If lesions are painful or scarring, prescription care beats anything here.
                </Text>
              </View>
              <IconChevronRight color={palette.mauve} />
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function LoadingDetail({ onBack }: { onBack: () => void }) {
  return (
    <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
      <Pressable onPress={onBack} hitSlop={12} style={{ marginBottom: spacing.xl }}>
        <CircleIcon size={34} border={palette.hairlineStrong}>
          <IconArrowLeft color={palette.textMuted} />
        </CircleIcon>
      </Pressable>
      <Skeleton width="40%" height={12} />
      <View style={{ height: spacing.md }} />
      <Skeleton width="70%" height={34} />
      <View style={{ height: spacing.xl }} />
      <SkeletonCard height={160} />
      <View style={{ height: spacing.lg }} />
      <SkeletonCard height={120} />
    </Screen>
  );
}

function RegionBlot({
  style,
  tone,
  strong,
}: {
  style: ViewStyle;
  tone: SeverityTone;
  strong?: boolean;
}) {
  const color = tone === 'coral' ? palette.coral : tone === 'gold' ? palette.gold : palette.sage;
  return (
    <View
      style={[
        style,
        {
          position: 'absolute',
          borderRadius: 44,
          backgroundColor: color,
          opacity: strong ? 0.34 : 0.16,
        },
      ]}
    />
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <View>
      <Text variant="h3" style={{ fontSize: 26 }}>
        {n}
      </Text>
      <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}
