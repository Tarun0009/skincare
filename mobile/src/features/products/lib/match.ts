import type { ConditionScore, Routine } from '@shared/types';
import { PRODUCT_CATALOG, type CatalogProduct } from '../data/catalog';

export interface ScoredProduct extends CatalogProduct {
  matchPercent: number;
  matchedConditions: ConditionScore['type'][];
}

/**
 * Rank the catalog against a scan's conditions + routine steps.
 * Score = severity-weighted overlap of targets, with a bonus for products
 * whose ingredients literally appear in the routine we already generated.
 */
export function matchProducts(
  conditions: ConditionScore[],
  routine: Routine
): ScoredProduct[] {
  const conditionsByType = new Map(conditions.map((c) => [c.type, c]));
  const routineIngredients = new Set(
    [...routine.am, ...routine.pm]
      .flatMap((s) => s.ingredientsToLookFor)
      .map((s) => s.toLowerCase())
  );

  const scored = PRODUCT_CATALOG.map<ScoredProduct>((p) => {
    let score = 0;
    let maxScore = 0;
    const matched: ConditionScore['type'][] = [];

    for (const target of p.targets) {
      const cond = conditionsByType.get(target);
      const weight = cond ? Math.max(1, cond.severity) : 0.5;
      maxScore += 5;
      if (cond) {
        score += weight;
        matched.push(target);
      }
    }

    const ingredientHits = p.ingredients.filter((ing) =>
      routineIngredients.has(ing.toLowerCase())
    ).length;
    score += ingredientHits * 2;
    maxScore += p.ingredients.length * 2;

    const matchPercent = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);
    return {
      ...p,
      matchPercent: Math.max(30, Math.min(99, matchPercent + 40)),
      matchedConditions: matched,
    };
  });

  return scored.sort((a, b) => b.matchPercent - a.matchPercent);
}
