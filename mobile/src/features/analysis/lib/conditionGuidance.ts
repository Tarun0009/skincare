import type { ConditionType } from '@shared/types';

interface Guidance {
  headline: string;
  targets: string[];
  reason: string;
}

/**
 * Static per-condition guidance surfaced on the ConditionDetail screen.
 * Kept in the app so it renders instantly and works offline — the AI-provided
 * `notes` field is layered on top for anything scan-specific.
 */
export const CONDITION_GUIDANCE: Record<ConditionType, Guidance> = {
  acne: {
    headline: 'Mixed comedonal and inflammatory, concentrated along the lower face.',
    targets: ['Adapalene 0.1%', 'Salicylic acid 2%', 'Niacinamide', 'Non-comedogenic SPF'],
    reason:
      'The model counted raised, erythematous lesions above the 2 mm threshold across the chin and jawline, plus follicular plugging without inflammation on the nose and forehead. Graded against the Investigator’s Global Assessment scale.',
  },
  pigmentation: {
    headline: 'Post-inflammatory marks across both cheeks.',
    targets: ['Niacinamide 10%', 'Vitamin C', 'Tranexamic acid', 'Daily SPF 50'],
    reason:
      'Detected localised areas of hyperpigmentation with defined edges, consistent with post-inflammatory marks rather than melasma. SPF is the single biggest lever here.',
  },
  dryness: {
    headline: 'Barrier looks slightly compromised, especially around the cheeks.',
    targets: ['Ceramides', 'Hyaluronic acid', 'Squalane', 'Occlusive at night'],
    reason:
      'Fine flaking and dullness detected in low-oil zones. This often shows up 2–3 weeks into a new retinoid ramp and settles as tolerance builds.',
  },
  oiliness: {
    headline: 'Excess sebum concentrated on the T-zone.',
    targets: ['Salicylic acid 2%', 'Niacinamide 10%', 'Oil-free moisturiser'],
    reason:
      'Specular highlight patterns concentrated in the T-zone suggest higher sebum output than the rest of the face. Rebalancing beats stripping.',
  },
  redness: {
    headline: 'Diffuse flushing pattern, cheeks and nose.',
    targets: ['Azelaic acid 10%', 'Centella asiatica', 'Mineral SPF', 'Avoid fragrance'],
    reason:
      'Elevated erythema in centrofacial regions with intact skin surface, consistent with reactive redness rather than active inflammation.',
  },
  wrinkles: {
    headline: 'Fine lines emerging in expressive areas.',
    targets: ['Retinoid', 'Peptides', 'Daily SPF 50', 'Antioxidant serum'],
    reason:
      'Early dynamic lines detected around the eyes and forehead. Consistent daily SPF and a nightly retinoid slow progression more than any single serum.',
  },
  pores: {
    headline: 'Visible pore texture, especially the nose and inner cheeks.',
    targets: ['Salicylic acid 2%', 'Retinoid', 'Niacinamide'],
    reason:
      'Follicular openings enlarged versus your skin’s neighbourhood baseline. Pores don’t "close" but keratolytics and retinoids reduce visible size.',
  },
  dark_circles: {
    headline: 'Under-eye pigmentation with mild puffiness.',
    targets: ['Caffeine', 'Vitamin C', 'Retinoid (low %)', 'SPF around the eye'],
    reason:
      'Combined vascular and pigmented pattern. Sleep and hydration influence the puffiness component more than any topical will.',
  },
};
