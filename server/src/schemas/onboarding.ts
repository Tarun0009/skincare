import { z } from 'zod';
import type { OnboardingContext } from '../../../shared/types.js';

/**
 * Validates the JSON blob sent alongside the scan photo. Every field is
 * optional so partially-filled quizzes still personalize what they can; a
 * completely absent or malformed blob is silently dropped so a bug in the
 * client can't fail an otherwise valid scan.
 */
export const onboardingContextSchema = z.object({
  selfReportedSkinType: z.enum(['dry', 'combination', 'oily', 'normal']).optional(),
  primaryConcerns: z
    .array(z.enum(['acne', 'pigmentation', 'aging', 'sensitivity', 'unsure']))
    .optional(),
  activeHistory: z
    .array(z.enum(['retinoid', 'aha_bha', 'rx', 'none']))
    .optional(),
  reactivity: z.enum(['rarely', 'sometimes', 'often']).optional(),
  spf: z.enum(['daily', 'sometimes', 'rarely', 'never']).optional(),
  goal: z.enum(['clearer', 'even', 'smoother', 'calmer']).optional(),
});

/**
 * Parse a raw string (from the multipart `preferences` field) into a typed
 * OnboardingContext. Returns undefined on any error — invalid input never
 * blocks the scan; it just means the user gets a generic analysis.
 */
export function parseOnboardingField(raw: string | undefined): OnboardingContext | undefined {
  if (!raw) return undefined;
  try {
    const json: unknown = JSON.parse(raw);
    const parsed = onboardingContextSchema.safeParse(json);
    if (!parsed.success) return undefined;
    // Strip any keys with no meaningful value so downstream code can trust
    // that "present" means "populated".
    const cleaned: OnboardingContext = {};
    if (parsed.data.selfReportedSkinType) cleaned.selfReportedSkinType = parsed.data.selfReportedSkinType;
    if (parsed.data.primaryConcerns?.length) cleaned.primaryConcerns = parsed.data.primaryConcerns;
    if (parsed.data.activeHistory?.length) cleaned.activeHistory = parsed.data.activeHistory;
    if (parsed.data.reactivity) cleaned.reactivity = parsed.data.reactivity;
    if (parsed.data.spf) cleaned.spf = parsed.data.spf;
    if (parsed.data.goal) cleaned.goal = parsed.data.goal;
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  } catch {
    return undefined;
  }
}
