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
const REGION = 'US';
const RESULTS_PER_QUERY = 3;
const FETCH_TIMEOUT_MS = 8000;

function normalizeQuery(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function fetchFromRapidApi(query: string): Promise<AmazonProduct[]> {
  if (!config.products.rapidApiKey) {
    // API not configured — return empty so the client renders an empty state
    // instead of throwing. Setup is one env var.
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
    if (!res.ok) {
      Sentry.captureMessage('rapidapi_amazon_non_ok', {
        level: 'warning',
        extra: { status: res.status, query },
      });
      return [];
    }
    const body = (await res.json()) as RapidApiSearchResponse;
    const raw = body.data?.products ?? [];
    return raw
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
      }));
  } catch (err) {
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
  const cached = await amazonCacheRepo.get(query);
  if (cached) return cached;
  const results = await fetchFromRapidApi(query);
  if (results.length > 0) {
    await amazonCacheRepo.set(query, results);
  }
  return results;
}
