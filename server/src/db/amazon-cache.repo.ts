import { pool } from './index.js';
import type { AmazonProduct } from '../services/amazon.js';

const TTL_HOURS = 24;

export const amazonCacheRepo = {
  /**
   * Look up cached search results for a normalized query. Returns undefined
   * when either no row exists OR the row is older than the TTL; the caller
   * treats both as "cache miss" and re-fetches.
   */
  async get(query: string): Promise<AmazonProduct[] | undefined> {
    const { rows } = await pool.query<{ results: AmazonProduct[] }>(
      `SELECT results
         FROM amazon_search_cache
        WHERE query = $1
          AND fetched_at > NOW() - INTERVAL '${TTL_HOURS} hours'`,
      [query]
    );
    return rows[0]?.results;
  },

  /**
   * Upsert cache entry. Uses NOW() for fetched_at so the row becomes
   * canonical for the next TTL_HOURS regardless of caller-side timing.
   */
  async set(query: string, results: AmazonProduct[]): Promise<void> {
    await pool.query(
      `INSERT INTO amazon_search_cache (query, results, fetched_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (query)
       DO UPDATE SET results = EXCLUDED.results, fetched_at = NOW()`,
      [query, JSON.stringify(results)]
    );
  },
};
