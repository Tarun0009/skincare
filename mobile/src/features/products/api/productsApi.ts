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
  matchedStep: {
    order: number;
    category: string;
    ingredient: string;
  };
}

export const productsApi = api.injectEndpoints({
  endpoints: (build) => ({
    productsForScan: build.query<{ products: RecommendedProduct[] }, string>({
      query: (scanId) => ({ url: `/products/for-scan/${scanId}` }),
    }),
  }),
});

export const { useProductsForScanQuery } = productsApi;
