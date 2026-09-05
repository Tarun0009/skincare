import { config } from '../config.js';
import { amazonCacheRepo } from '../db/amazon-cache.repo.js';
import { Sentry } from './sentry.js';

/**
 * The shape we send to mobile. Not every RapidAPI response includes every
 * field, so ratings/reviews are nullable — screens fall back gracefully.
 */
export interface AmazonProduct {
  asin: string;
  title: string;
  price: string; // "$14.99" — stringly typed by the API, kept as string here
  imageUrl: string;
  productUrl: string;
  starRating: number | null;
  numRatings: number | null;
  listingType: 'product' | 'search';
}

interface RapidApiSearchResponse {
  data?: {
    products?: Array<{
      asin?: string;
      product_title?: string;
      product_price?: string;
      product_photo?: string;
      product_url?: string;
      product_star_rating?: string;
      product_num_ratings?: number;
    }>;
  };
}

const ENDPOINT = 'https://real-time-amazon-data.p.rapidapi.com/search';
const HOST = 'real-time-amazon-data.p.rapidapi.com';
// India region — prices come back in INR (e.g. "₹1,234") from amazon.in.
const REGION = 'IN';
const RESULTS_PER_QUERY = 5;
// India's Amazon can be slow to respond first-hit; give it 15 s to avoid
// falling back to search-only when we're just experiencing normal latency.
const FETCH_TIMEOUT_MS = 15000;

function normalizeQuery(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function fetchFromRapidApi(query: string): Promise<AmazonProduct[]> {
  if (!config.products.rapidApiKey) {
    // eslint-disable-next-line no-console
    console.warn('[amazon] RAPIDAPI_KEY not set — returning empty for query:', query);
    return [];
  }

  const url = new URL(ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('page', '1');
  url.searchParams.set('country', REGION);
  url.searchParams.set('sort_by', 'RELEVANCE');
  url.searchParams.set('product_condition', 'NEW');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': config.products.rapidApiKey,
        'x-rapidapi-host': HOST,
      },
      signal: controller.signal,
    });
    // RapidAPI returns per-plan quota headers on every response, ok or not.
    const remaining = res.headers.get('x-ratelimit-requests-remaining');
    const limit = res.headers.get('x-ratelimit-requests-limit');

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('[amazon] non-OK response', {
        status: res.status,
        statusText: res.statusText,
        query,
        quota: remaining && limit ? `${remaining}/${limit}` : 'unknown',
      });
      Sentry.captureMessage('rapidapi_amazon_non_ok', {
        level: 'warning',
        extra: { status: res.status, query, remaining, limit },
      });
      return [];
    }

    if (remaining !== null && Number(remaining) < 20) {
      // eslint-disable-next-line no-console
      console.warn(
        `[amazon] RapidAPI quota low: ${remaining}/${limit ?? '?'} requests remaining this cycle`
      );
    }
    const body = (await res.json()) as RapidApiSearchResponse;
    const raw = body.data?.products ?? [];
    const mapped = raw
      .slice(0, RESULTS_PER_QUERY)
      .filter((p): p is Required<Pick<typeof p, 'asin' | 'product_title' | 'product_url'>> & typeof p =>
        Boolean(p.asin && p.product_title && p.product_url)
      )
      .map<AmazonProduct>((p) => ({
        asin: p.asin!,
        title: p.product_title!,
        price: p.product_price ?? '',
        imageUrl: p.product_photo ?? '',
        productUrl: p.product_url!,
        starRating: p.product_star_rating ? Number(p.product_star_rating) : null,
        numRatings: typeof p.product_num_ratings === 'number' ? p.product_num_ratings : null,
        listingType: 'product',
      }));
    // eslint-disable-next-line no-console
    console.info(
      `[amazon] "${query}" → ${mapped.length}/${raw.length} products, images: ${
        mapped.filter((p) => p.imageUrl.length > 0).length
      }`
    );
    return mapped;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[amazon] fetch failed', { query, err });
    Sentry.captureException(err, { tags: { source: 'rapidapi_amazon' }, extra: { query } });
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Cached search. Populates Postgres cache on miss; returns cached results on
 * hit. Shared across users, so an ingredient looked up once benefits everyone.
 */
export async function searchAmazon(rawQuery: string): Promise<AmazonProduct[]> {
  const query = normalizeQuery(rawQuery);
  if (query.length === 0) return [];
  // Keep country-specific results separate (older deployments used US).
  const cacheKey = `${REGION.toLowerCase()}:${query}`;
  const cached = await amazonCacheRepo.get(cacheKey);
  if (cached) return cached.map((product) => ({ ...product, listingType: 'product' }));
  const results = await fetchFromRapidApi(query);
  if (results.length > 0) {
    await amazonCacheRepo.set(cacheKey, results);
    return results;
  }

  // A stale listing is still more useful than an empty screen when RapidAPI
  // is temporarily unavailable or rate-limited.
  const stale = await amazonCacheRepo.getStale(cacheKey);
  if (stale && stale.length > 0) {
    return stale.map((product) => ({ ...product, listingType: 'product' }));
  }

  // Last-resort personalized Amazon search. It contains no invented price or
  // rating and keeps product discovery useful even before RAPIDAPI_KEY is set.
  return [
    {
      asin: `search-${encodeURIComponent(query)}`,
      title: `Browse ${query}`,
      price: '',
      imageUrl: '',
      productUrl: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
      starRating: null,
      numRatings: null,
      listingType: 'search',
    },
  ];
}
