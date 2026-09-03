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
 * Build a search query for one routine step. Prefers the first
 * ingredient-to-look-for (that's the specific active); falls back to the
 * category as a broader search.
 */
function queryForStep(step: RoutineStep): string {
  const ingredient = step.ingredientsToLookFor[0];
  if (ingredient) return `${ingredient} ${step.category}`;
  return `${step.category} skincare`;
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

    const recommendations: ProductRecommendation[] = [];
    for (const [query, step] of uniqueQueries) {
      const products = await searchAmazon(query);
      for (const p of products) {
        recommendations.push({
          ...p,
          matchedStep: {
            order: step.order,
            category: step.category,
            ingredient: step.ingredientsToLookFor[0] ?? '',
          },
        });
      }
    }

    return { products: recommendations };
  });
}
