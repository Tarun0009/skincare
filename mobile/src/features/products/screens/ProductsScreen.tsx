import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Card, Screen, SkeletonCard, Text } from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { useListScansQuery, useGetScanQuery } from '../../analysis/api/scansApi';
import { matchProducts, type ScoredProduct } from '../lib/match';
import { CONDITION_LABEL } from '@shared/types';
import type { RootScreenProps } from '../../../app/navigation/types';

type FilterKey = 'budget' | 'fragrance_free' | 'drugstore' | 'owned';

const FILTER_LABEL: Record<FilterKey, string> = {
  budget: 'Under $25',
  fragrance_free: 'Fragrance-free',
  drugstore: 'Drugstore',
  owned: 'Already own',
};

export function ProductsScreen({ navigation }: RootScreenProps<'Products'>) {
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set(['budget']));
  const { data: list, isLoading: isListLoading } = useListScansQuery();
  const latest = list?.scans[0];
  const { data: scan, isLoading: isScanLoading } = useGetScanQuery(latest?.id ?? '', {
    skip: !latest,
  });

  const matches = useMemo<ScoredProduct[]>(() => {
    if (!scan) return [];
    return matchProducts(scan.analysis.conditions, scan.routine);
  }, [scan]);

  const filtered = useMemo(() => {
    return matches.filter((p) => {
      if (filters.has('budget') && p.price >= 25) return false;
      if (filters.has('fragrance_free') && !p.fragranceFree) return false;
      if (filters.has('drugstore') && !p.drugstore) return false;
      return true;
    });
  }, [matches, filters]);

  const totalPrice = filtered.slice(0, 4).reduce((s, p) => s + p.price, 0);

  const toggle = (f: FilterKey) => {
    const next = new Set(filters);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    setFilters(next);
  };

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <View style={{ paddingHorizontal: spacing.xxl }}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text variant="label" tone="mauve" style={{ marginBottom: spacing.md }}>
              ← Back
            </Text>
          </Pressable>
          <Text variant="h1">Matched products</Text>
          <Text variant="bodySm" tone="dim" style={{ marginTop: 7 }}>
            Ranked against your findings and budget
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xxl, gap: 8, paddingTop: spacing.lg }}
        >
          {(Object.keys(FILTER_LABEL) as FilterKey[]).map((k) => {
            const active = filters.has(k);
            return (
              <Pressable key={k} onPress={() => toggle(k)}>
                <View
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: radii.pill,
                    backgroundColor: active ? palette.cream : 'rgba(242,237,228,0.06)',
                  }}
                >
                  <Text variant="tiny" style={{ color: active ? palette.bg : palette.textMuted }}>
                    {FILTER_LABEL[k]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: 12 }}>
          {(isListLoading || isScanLoading) &&
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={110} />)}
          {!isListLoading && !isScanLoading && filtered.length === 0 && (
            <Card tone="dashed" padding={20}>
              <Text tone="muted">Nothing matches those filters. Try loosening the budget.</Text>
            </Card>
          )}
          {!isListLoading && !isScanLoading && filtered.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}

          {filtered.length > 0 && (
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
              <View>
                <Text variant="label">Full routine, top 4 products</Text>
                <Text variant="caption" tone="dim" style={{ marginTop: 5 }}>
                  ${totalPrice.toFixed(2)} · about 3 months
                </Text>
              </View>
              <Button label="Add all" full={false} style={{ paddingVertical: 10, paddingHorizontal: 15 }} />
            </View>
          )}

          <Text variant="caption" tone="faint" style={{ marginTop: spacing.sm }}>
            Some links are affiliate links. Ranking is not paid for.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function ProductRow({ product }: { product: ScoredProduct }) {
  const overBudget = product.price >= 25;
  const matchTone =
    product.matchPercent >= 85 ? 'sage' : product.matchPercent >= 70 ? 'gold' : 'coral';

  return (
    <Card padding={16}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <View
          style={{
            width: 64,
            height: 78,
            borderRadius: radii.sm,
            backgroundColor: '#2C251E',
            borderWidth: 1,
            borderColor: palette.hairline,
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: 6,
          }}
        >
          <Text variant="tiny" tone="faint" style={{ fontSize: 8 }}>
            photo
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="caption" tone="dim">
              {product.brand}
            </Text>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: matchTone === 'sage' ? 'rgba(147,168,122,0.16)' : matchTone === 'gold' ? 'rgba(217,162,63,0.16)' : 'rgba(212,103,74,0.16)',
              }}
            >
              <Text
                variant="tiny"
                style={{ color: matchTone === 'sage' ? palette.sageSoft : matchTone === 'gold' ? palette.goldSoft : palette.coralSoft, fontWeight: '700' }}
              >
                {product.matchPercent}% match
              </Text>
            </View>
          </View>
          <Text variant="labelLg" style={{ marginTop: 5 }}>
            {product.name}
          </Text>
          {product.matchedConditions.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 9, flexWrap: 'wrap' }}>
              {product.matchedConditions.slice(0, 2).map((c) => (
                <View
                  key={c}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: 'rgba(212,103,74,0.14)',
                  }}
                >
                  <Text variant="tiny" style={{ color: palette.coralSoft }}>
                    {CONDITION_LABEL[c]}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
            <Text variant="labelLg">${product.price.toFixed(2)}</Text>
            <Text variant="caption" tone="dim">
              {overBudget ? 'Over budget' : product.size}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}
