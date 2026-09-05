import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { Card, FadeIn, PressableScale, Screen, SkeletonCard, Text } from '../../../ui/primitives';
import { palette, radii, spacing } from '../../../ui/theme/tokens';
import { useProductsForScanQuery, type RecommendedProduct } from '../api/productsApi';
import type { RootScreenProps } from '../../../app/navigation/types';

type FilterKey = 'budget' | 'high_rated' | 'many_reviews';

const FILTER_LABEL: Record<FilterKey, string> = {
  budget: 'Under ₹2,000',
  high_rated: '4★ and up',
  many_reviews: '1,000+ reviews',
};

const BUDGET_MAX_INR = 2000;

/**
 * Extracts the numeric price from the currency-formatted string Amazon
 * returns (e.g. "₹1,234.00" or "$14.99"). Commas are stripped so INR
 * thousands separators don't truncate the parse.
 */
function priceAsNumber(price: string): number | null {
  const match = price.match(/[\d.,]+/);
  if (!match) return null;
  const numeric = Number(match[0].replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

export function ProductsScreen({ navigation, route }: RootScreenProps<'Products'>) {
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());

  const { data, error, isLoading, isFetching, refetch } = useProductsForScanQuery(
    route.params.scanId
  );

  const products = useMemo(() => data?.products ?? [], [data]);
  const hasSearchFallbacks = products.some((product) => product.listingType === 'search');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filters.has('budget')) {
        const price = priceAsNumber(p.price);
        if (price === null || price >= BUDGET_MAX_INR) return false;
      }
      if (filters.has('high_rated')) {
        if (p.starRating === null || p.starRating < 4) return false;
      }
      if (filters.has('many_reviews')) {
        if (p.numRatings === null || p.numRatings < 1000) return false;
      }
      return true;
    });
  }, [products, filters]);

  const toggle = (f: FilterKey) => {
    const next = new Set(filters);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    setFilters(next);
  };

  const showSkeletons = isLoading || (isFetching && products.length === 0);
  const hasBlockingError = Boolean(error) && products.length === 0;

  return (
    <Screen edges={['top']} style={{ paddingBottom: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <FadeIn slideUp>
          <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.sm }}>
            <Pressable onPress={() => navigation.goBack()}>
              <Text variant="labelSm" tone="mauve" upper style={{ marginBottom: spacing.md }}>
                ← Back
              </Text>
            </Pressable>
            <Text variant="labelSm" tone="dim" upper>
              Amazon product discovery
            </Text>
            <Text variant="h1" style={{ marginTop: spacing.sm }}>
              Matched products
            </Text>
            <Text variant="bodySm" tone="dim" style={{ marginTop: spacing.sm }}>
              {hasSearchFallbacks
                ? 'Personalized searches for every routine step · not paid rankings'
                : 'Real listings pulled per routine step · not paid rankings'}
            </Text>
          </View>
        </FadeIn>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xxl,
            gap: spacing.sm,
            paddingTop: spacing.xl,
          }}
        >
          {(Object.keys(FILTER_LABEL) as FilterKey[]).map((k) => {
            const active = filters.has(k);
            return (
              <Pressable key={k} onPress={() => toggle(k)}>
                <View
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.pill,
                    backgroundColor: active ? palette.cream : palette.hairline,
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

        <View style={{ paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, gap: spacing.md }}>
          {showSkeletons &&
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} height={110} />)}

          {!showSkeletons && hasBlockingError && (
            <Card tone="dashed" padding={spacing.xl}>
              <Text tone="muted">We couldn't load your product matches.</Text>
              <Pressable onPress={refetch} style={{ alignSelf: 'flex-start', marginTop: spacing.md }}>
                <Text variant="label" tone="mauve">
                  Try again
                </Text>
              </Pressable>
            </Card>
          )}

          {!showSkeletons && !hasBlockingError && filtered.length === 0 && (
            <Card tone="dashed" padding={spacing.xl}>
              <Text tone="muted">
                {products.length === 0
                  ? 'This routine has no product steps to match yet.'
                  : 'Nothing matches those filters — try loosening them.'}
              </Text>
            </Card>
          )}

          {!showSkeletons &&
            !hasBlockingError &&
            filtered.map((p) => (
              <ProductRow
                key={`${p.matchedStep.order}-${p.matchedStep.category}-${p.asin}`}
                product={p}
              />
            ))}

          {filtered.length > 0 && (
            <Text variant="caption" tone="faint" style={{ marginTop: spacing.sm }}>
              {hasSearchFallbacks
                ? 'Some cards open a personalized Amazon search when live listings are unavailable.'
                : 'Prices shown are live from Amazon. Ranking is not paid for.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function ProductRow({ product }: { product: RecommendedProduct }) {
  const isSearch = product.listingType === 'search';
  const openOnAmazon = () => {
    if (product.productUrl) {
      void Linking.openURL(product.productUrl).catch(() => undefined);
    }
  };

  return (
    <PressableScale
      onPress={openOnAmazon}
      accessibilityRole="link"
      accessibilityLabel={`${isSearch ? 'Search for' : 'Open'} ${product.title} on Amazon`}
    >
      <Card padding={spacing.lg}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <ProductImage imageUrl={product.imageUrl} category={product.matchedStep.category} />
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: spacing.sm,
              }}
            >
              <Text
                variant="labelSm"
                tone="dim"
                upper
                style={{ flex: 1, letterSpacing: 1.2 }}
              >
                {product.matchedStep.ingredient || product.matchedStep.category}
              </Text>
              {product.starRating !== null && (
                <Text variant="tiny" tone="cream">
                  ★ {product.starRating.toFixed(1)}
                </Text>
              )}
            </View>
            <Text variant="labelLg" style={{ marginTop: spacing.sm }} numberOfLines={2}>
              {product.title}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: spacing.sm,
                marginTop: spacing.md,
              }}
            >
              <Text variant="labelLg">{product.price || (isSearch ? 'Browse options' : '—')}</Text>
              {product.numRatings !== null && (
                <Text variant="caption" tone="dim">
                  {product.numRatings.toLocaleString()} reviews
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card>
    </PressableScale>
  );
}

/**
 * Real product image with a category-tile fallback. If the Amazon CDN returns
 * an empty URL or the image fails to load, we render an editorial tile with
 * the category name — never a broken image.
 */
function ProductImage({ imageUrl, category }: { imageUrl: string; category: string }) {
  const [failed, setFailed] = useState(false);
  const show = imageUrl.length > 0 && !failed;

  return (
    <View
      style={{
        width: 72,
        height: 88,
        borderRadius: radii.sm,
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.hairline,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {show ? (
        <Image
          source={{ uri: imageUrl }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <Text variant="tiny" tone="faint" upper style={{ letterSpacing: 1.4 }}>
          {category}
        </Text>
      )}
    </View>
  );
}
