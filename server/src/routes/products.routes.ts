import type { FastifyInstance } from 'fastify';
import { verifyFirebaseToken } from '../hooks/auth.js';
import { scansRepo } from '../db/scans.repo.js';
import { searchAmazon, type AmazonProduct } from '../services/amazon.js';
import type { RoutineStep } from '../../../shared/types.js';

export interface ProductRecommendation extends AmazonProduct {
  matchedStep: {
    order: number;
    category: string;
    ingredient: string;
  };
}

/**
 * Build a search query for one routine step. Strips percentages, ranges and
 * concentration suffixes so "niacinamide 5-10%" and "niacinamide 10%" both
 * collapse to "niacinamide serum" — dramatically better cache hit rate on
 * the RapidAPI free tier (100 req/month).
 */
function queryForStep(step: RoutineStep): string {
  const raw = step.ingredientsToLookFor[0];
  if (!raw) return `${step.category} skincare`;
  const simplified = raw
    .toLowerCase()
    .replace(/\d+(\.\d+)?\s*[-–]?\s*\d*(\.\d+)?\s*%/g, '') // strip "5%", "5-10%", "0.1%"
    .replace(/\b(low|mid|high|max)\b/g, '')
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const finalIngredient = simplified.length > 0 ? simplified : raw.toLowerCase();
  return `${finalIngredient} ${step.category}`;
}

export async function productRoutes(app: FastifyInstance) {
  app.addHook('preHandler', verifyFirebaseToken);

  /**
   * Live product recommendations for a scan. For each routine step we search
   * Amazon by the primary ingredient + category, cache the response for 24
   * hours, and return up to 3 products per step flattened into one list.
   *
   * The scan must belong to the authenticated user — the repo lookup uses
   * the Firebase UID as a WHERE filter.
   */
  app.get('/products/for-scan/:scanId', async (req, reply) => {
    const userId = req.firebaseUser!.uid;
    const { scanId } = req.params as { scanId: string };

    const scan = await scansRepo.findById(scanId, userId);
    if (!scan) return reply.code(404).send({ error: 'scan_not_found' });

    const routine = scan.routine_json;
    const steps = [...routine.am, ...routine.pm];

    // Deduplicate identical searches (e.g. "niacinamide serum" in both AM and
    // PM) so we don't spend two API calls for the same result set.
    const uniqueQueries = new Map<string, RoutineStep>();
    for (const step of steps) {
      const q = queryForStep(step);
      if (!uniqueQueries.has(q)) uniqueQueries.set(q, step);
    }

    // Run independent searches together. Sequential 8-second upstream calls
    // could exceed the client's request timeout for a normal multi-step routine.
    const groups = await Promise.all(
      [...uniqueQueries].map(async ([query, step]) => {
        const products = await searchAmazon(query);
        return products.map((p) => ({
          ...p,
          matchedStep: {
            order: step.order,
            category: step.category,
            ingredient: step.ingredientsToLookFor[0] ?? '',
          },
        }));
      })
    );
    const recommendations: ProductRecommendation[] = groups.flat();

    return { products: recommendations };
  });
}
