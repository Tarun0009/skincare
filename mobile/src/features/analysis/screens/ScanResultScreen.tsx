import { Pressable, ScrollView, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Divider,
  IconChevronRight,
  ProgressBar,
  ProgressRing,
  Screen,
  Skeleton,
  SkeletonCard,
  SkeletonCircle,
  Text,
} from '../../../ui/primitives';
import { palette, spacing } from '../../../ui/theme/tokens';
import { useAppSelector } from '../../../core/hooks/redux';
import { useGetScanQuery } from '../api/scansApi';
import { bucketForSeverity, severityScore, sortByImpact, type SeverityTone } from '../lib/severity';
import { CONDITION_LABEL } from '@shared/types';
import type { RootScreenProps } from '../../../app/navigation/types';

export function ScanResultScreen({ route, navigation }: RootScreenProps<'ScanResult'>) {
  const { scanId } = route.params;
  const showConfidence = useAppSelector((s) => s.preferences.showConfidence);
  const { data, isLoading, error } = useGetScanQuery(scanId);

  if (isLoading) return <LoadingResult />;
  if (error || !data) {
    return (
      <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
        <Text tone="muted">Couldn't load this scan.</Text>
      </Screen>
    );
  }

  const conditions = sortByImpact(data.analysis.conditions);
  const avgConfidence =
    conditions.length > 0
      ? conditions.reduce((acc, c) => acc + c.confidence, 0) / conditions.length
      : 0;
  const created = new Date(data.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  const summarySnippet = data.analysis.summary.split(/\.\s+/)[0] ?? '';

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <View
          style={{
            paddingHorizontal: spacing.xxl,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text variant="bodySm" tone="dim">
            Scan · {created}
          </Text>
          <Text variant="label" tone="mauve">
            Share
          </Text>
        </View>

        {/* Score + summary */}
        <View
          style={{
            paddingHorizontal: spacing.xxl,
            paddingTop: spacing.xl,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xxl,
          }}
        >
          <ProgressRing value={data.analysis.overallScore} size={124} stroke={9}>
            <View style={{ alignItems: 'center' }}>
              <Text variant="display3" style={{ fontSize: 42 }}>
                {data.analysis.overallScore}
              </Text>
              <Text variant="labelSm" tone="dim" upper style={{ marginTop: 4 }}>
                of 100
              </Text>
            </View>
          </ProgressRing>
          <View style={{ flex: 1, gap: 11 }}>
            <Text variant="h3">{formatSkinType(data.analysis.skinType)}</Text>
            {summarySnippet !== '' && <Chip tone="sage" label={summarySnippet.slice(0, 32)} />}
            <Text variant="caption" tone="dim">
              {data.analysis.disclaimer}
            </Text>
          </View>
        </View>

        {/* Findings header */}
        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
            }}
          >
            <Text variant="labelSm" tone="dim" upper>
              Findings
            </Text>
            {showConfidence && conditions.length > 0 && (
              <Text variant="caption" tone="dim">
                Confidence {avgConfidence.toFixed(2)}
              </Text>
            )}
          </View>

          <View style={{ gap: spacing.lg }}>
            {conditions.length === 0 ? (
              <Card tone="dashed" padding={20}>
                <Text tone="muted">Nothing flagged in this scan.</Text>
              </Card>
            ) : (
              conditions.map((c) => {
                const bucket = bucketForSeverity(c.severity);
                return (
                  <Pressable
                    key={c.type}
                    onPress={() =>
                      navigation.navigate('ConditionDetail', {
                        scanId,
                        conditionType: c.type,
                      })
                    }
                  >
                    <View style={{ gap: spacing.sm }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text variant="labelLg">{CONDITION_LABEL[c.type]}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9 }}>
                          <Text variant="label" style={{ color: toneColor(bucket.tone) }}>
                            {bucket.label}
                          </Text>
                          <Text variant="caption" tone="dim">
                            {severityScore(c.severity)}
                          </Text>
                        </View>
                      </View>
                      <ProgressBar value={severityScore(c.severity)} tone={bucket.tone} />
                      {c.notes && (
                        <Text variant="caption" tone="dim">
                          {c.notes}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl }}>
          <Divider />
          <Text variant="caption" tone="faint" style={{ paddingTop: spacing.md }}>
            Not a medical diagnosis. Skin Analyzer is a cosmetic guidance tool.
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.lg }}>
          <Button label="See my routine" onPress={() => navigation.navigate('MainTabs')} />
          <Pressable
            onPress={() => navigation.navigate('Comparison')}
            style={{ alignSelf: 'center', marginTop: spacing.lg, flexDirection: 'row', gap: 6 }}
          >
            <Text variant="label" tone="mauve">
              Compare to my baseline
            </Text>
            <IconChevronRight size={16} color={palette.mauve} />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function LoadingResult() {
  return (
    <Screen edges={['top']} style={{ paddingHorizontal: spacing.xxl }}>
      <View style={{ flexDirection: 'row', gap: spacing.xxl, alignItems: 'center' }}>
        <SkeletonCircle size={124} />
        <View style={{ flex: 1, gap: spacing.md }}>
          <Skeleton width="80%" height={26} />
          <Skeleton width="60%" height={16} />
          <Skeleton width="90%" height={14} />
        </View>
      </View>
      <View style={{ height: spacing.xxl }} />
      <View style={{ gap: spacing.lg }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} height={64} />
        ))}
      </View>
    </Screen>
  );
}

function toneColor(t: SeverityTone): string {
  return t === 'sage' ? palette.sageSoft : t === 'gold' ? palette.goldSoft : palette.coralSoft;
}

function formatSkinType(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
