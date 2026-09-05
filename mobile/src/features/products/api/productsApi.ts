import { api } from '../../../core/http/api';

/**
 * Response from GET /products/for-scan/:scanId. Products come pre-flattened,
 * each carrying the routine step they were matched against so the mobile UI
 * can group and label them without a second call.
 */
export interface RecommendedProduct {
  asin: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  starRating: number | null;
  numRatings: number | null;
  listingType?: 'product' | 'search';
  matchedStep: {
    order: number;
    category: string;
    ingredient: string;
  };
}

export const productsApi = api.injectEndpoints({
  endpoints: (build) => ({
    productsForScan: build.query<{ products: RecommendedProduct[] }, string>({
      query: (scanId) => ({
        url: `/products/for-scan/${scanId}`,
        // Several upstream Amazon searches may be required for one routine.
        timeout: 35_000,
      }),
    }),
  }),
});

export const { useProductsForScanQuery } = productsApi;
