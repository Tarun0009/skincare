import { ALL_CONDITIONS, type OnboardingContext } from '../../../shared/types.js';

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

const SKIN_TYPE_LABEL = {
  dry: 'dry (tight, sometimes flaky)',
  combination: 'combination (T-zone oily, cheeks balanced)',
  oily: 'oily (shiny all over)',
  normal: 'normal (comfortable, balanced)',
} as const;

const CONCERN_LABEL = {
  acne: 'active breakouts and clogged pores',
  pigmentation: 'marks and uneven tone',
  aging: 'early lines and dullness',
  sensitivity: 'redness and reactivity',
  unsure: 'general baseline curiosity (no specific concern)',
} as const;

const HISTORY_LABEL = {
  retinoid: 'a retinoid (adapalene / tretinoin)',
  aha_bha: 'chemical exfoliants (glycolic / salicylic)',
  rx: 'a prescription topical or oral treatment',
  none: 'no active ingredients yet',
} as const;

const REACTIVITY_LABEL = {
  rarely: 'tolerates most new products',
  sometimes: 'sometimes stings or flushes on introduction',
  often: 'reacts often — must ramp slowly and patch-test',
} as const;

const SPF_LABEL = {
  daily: 'wears SPF every day',
  sometimes: 'wears SPF only on sunny days',
  rarely: 'rarely wears SPF',
  never: 'does not currently wear SPF but is open to starting',
} as const;

const GOAL_LABEL = {
  clearer: 'fewer active breakouts in 8 weeks',
  even: 'a more even tone in 8 weeks',
  smoother: 'smoother texture in 8 weeks',
  calmer: 'less redness and reactivity in 8 weeks',
} as const;

/**
 * Turn the onboarding blob into a bulleted context block for Gemini. Every
 * line is optional — we only render the fields the user actually answered so
 * a half-completed quiz still gets partial personalization instead of no
 * personalization.
 */
function renderOnboardingBlock(ctx: OnboardingContext | undefined): string {
  if (!ctx) return '';
  const lines: string[] = [];

  if (ctx.selfReportedSkinType) {
    lines.push(`- Self-reports skin as ${SKIN_TYPE_LABEL[ctx.selfReportedSkinType]}.`);
  }
  if (ctx.primaryConcerns?.length) {
    const list = ctx.primaryConcerns.map((c) => CONCERN_LABEL[c]).join('; ');
    lines.push(`- Primary concerns: ${list}.`);
  }
  if (ctx.activeHistory?.length) {
    const list = ctx.activeHistory.map((h) => HISTORY_LABEL[h]).join('; ');
    lines.push(`- Prior experience with actives: ${list}.`);
  }
  if (ctx.reactivity) {
    lines.push(`- Reactivity: ${REACTIVITY_LABEL[ctx.reactivity]}.`);
  }
  if (ctx.spf) {
    lines.push(`- SPF habit: ${SPF_LABEL[ctx.spf]}.`);
  }
  if (ctx.goal) {
    lines.push(`- 8-week goal: ${GOAL_LABEL[ctx.goal]}.`);
  }

  if (lines.length === 0) return '';

  return `

User context (from the onboarding quiz — use this to bias the routine, NOT the
visual assessment; the vision findings stay evidence-based):
${lines.join('\n')}

Personalization rules:
- If reactivity is "often" or the user has never used actives ("none" in
  history), ramp gently: introduce one active at a time, prefer lower
  concentrations (e.g. adapalene 0.1% over retinoid alternatives), and add a
  warning about patch-testing.
- If SPF habit is "rarely" or "never", make the AM sunscreen step highlight
  behavior change, not just product choice.
- If the goal is pigmentation-driven ("even"), lean niacinamide / azelaic acid
  / tranexamic acid rather than heavy exfoliation.
- If the goal is acne-driven ("clearer"), keep the routine simple (3 steps
  each side) and avoid stacking irritating actives.
- If the self-reported skin type conflicts with what the photo shows, trust
  the photo for the analysis but mention the discrepancy in the summary.`;
}

export function buildAnalysisPrompt(opts: {
  previousBaselineSummary?: string;
  onboarding?: OnboardingContext;
}): string {
  const compare = opts.previousBaselineSummary
    ? `\n\nPrevious baseline for context (do not just copy — re-observe the current photo):\n${opts.previousBaselineSummary}`
    : '';

  const personalization = renderOnboardingBlock(opts.onboarding);

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
(tretinoin, hydroquinone) — recommend over-the-counter alternatives.${personalization}${compare}
  `.trim();
}
