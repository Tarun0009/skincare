import { ALL_CONDITIONS } from '../../../shared/types.js';

/**
 * Single-call prompt: analyze the selfie AND generate a personalized routine.
 * We keep it one call to minimize latency and cost for the free Gemini tier.
 */
export const SKIN_ANALYSIS_SYSTEM = `
You are a cautious skincare analysis assistant. You look at a user selfie and
produce a structured assessment plus a routine suggestion.

Rules:
- You are NOT a dermatologist. Always include a disclaimer telling the user to
  see a licensed professional for medical concerns (severe acne, sudden changes,
  suspicious moles).
- Never diagnose medical conditions (rosacea, eczema, skin cancer, etc.).
  You may describe visible signs ("redness", "dry patches") only.
- Be honest but kind. Focus on what the person can actually change.
- Recommend ingredients (e.g. "niacinamide", "salicylic acid 2%"), NOT specific
  brand names.
- If the image quality is too poor, obscured, not a face, or has no visible skin,
  set overallScore to 0 and put "poor_image_quality" in summary.
- Output MUST be valid JSON matching the requested schema. No prose outside JSON.
`.trim();

export function buildAnalysisPrompt(opts: {
  previousBaselineSummary?: string;
}): string {
  const compare = opts.previousBaselineSummary
    ? `\n\nPrevious baseline for context (do not just copy — re-observe the current photo):\n${opts.previousBaselineSummary}`
    : '';

  return `
Analyze the selfie and return JSON with this exact shape:

{
  "analysis": {
    "skinType": "dry" | "oily" | "combination" | "normal" | "sensitive",
    "overallScore": <integer 0-100, higher = healthier>,
    "conditions": [
      {
        "type": ${JSON.stringify(ALL_CONDITIONS)}[i],
        "severity": <integer 0-5>,
        "confidence": <float 0-1>,
        "locations": ["forehead"|"cheeks"|"nose"|"chin"|"jawline", ...],
        "notes": "<one short sentence>"
      }
    ],
    "summary": "<2-3 sentences the user will read first>",
    "disclaimer": "<one sentence, must mention seeing a dermatologist for medical concerns>"
  },
  "routine": {
    "am": [
      {
        "order": <1-based int>,
        "timeOfDay": "am",
        "category": "cleanser"|"toner"|"serum"|"moisturizer"|"sunscreen"|"treatment",
        "productName": "<generic name, e.g. 'Gentle gel cleanser'>",
        "ingredientsToLookFor": ["<ingredient>", ...],
        "reason": "<one sentence tying it to a condition above>"
      }
    ],
    "pm": [ /* same shape, timeOfDay: "pm" */ ],
    "warnings": ["<patch test warnings, sun sensitivity warnings, etc.>"]
  }
}

Include only conditions with severity >= 1. Sort conditions by severity desc.
AM routine should always end with sunscreen. PM routine should never include sunscreen.
Keep each routine to 3-5 steps. Do not recommend prescription-only ingredients
(tretinoin, hydroquinone) — recommend over-the-counter alternatives.${compare}
  `.trim();
}
