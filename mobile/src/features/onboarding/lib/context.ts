import type {
  ActiveHistory,
  EightWeekGoal,
  OnboardingContext,
  PrimaryConcern,
  ReactivityLevel,
  SelfReportedSkinType,
  SpfFrequency,
} from '@shared/types';

/**
 * Narrow a raw quiz answer (unknown string/array) down to a strongly typed
 * literal union. Returns undefined when the value doesn't match any allowed
 * option — treats corrupt/stale state as "unanswered" rather than crashing.
 */
function pickSingle<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value !== 'string') return undefined;
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

function pickMulti<T extends string>(value: unknown, allowed: readonly T[]): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((v): v is T =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v)
  );
  return filtered.length > 0 ? filtered : undefined;
}

const SKIN_TYPES: readonly SelfReportedSkinType[] = ['dry', 'combination', 'oily', 'normal'];
const CONCERNS: readonly PrimaryConcern[] = [
  'acne',
  'pigmentation',
  'aging',
  'sensitivity',
  'unsure',
];
const HISTORY: readonly ActiveHistory[] = ['retinoid', 'aha_bha', 'rx', 'none'];
const REACTIVITY: readonly ReactivityLevel[] = ['rarely', 'sometimes', 'often'];
const SPF: readonly SpfFrequency[] = ['daily', 'sometimes', 'rarely', 'never'];
const GOAL: readonly EightWeekGoal[] = ['clearer', 'even', 'smoother', 'calmer'];

/**
 * Turn the loosely-typed Redux answer map into an OnboardingContext the API
 * accepts. Fields absent from the answers stay undefined; the server prompt
 * only surfaces the fields that are present, so this is a clean "personalize
 * what we know" contract.
 */
export function toOnboardingContext(
  answers: Record<string, string | string[]>
): OnboardingContext | undefined {
  const ctx: OnboardingContext = {};

  const skin = pickSingle(answers.skin_type, SKIN_TYPES);
  if (skin) ctx.selfReportedSkinType = skin;

  const concerns = pickMulti(answers.concerns, CONCERNS);
  if (concerns) ctx.primaryConcerns = concerns;

  const history = pickMulti(answers.history, HISTORY);
  if (history) ctx.activeHistory = history;

  const reactivity = pickSingle(answers.reactivity, REACTIVITY);
  if (reactivity) ctx.reactivity = reactivity;

  const spf = pickSingle(answers.spf, SPF);
  if (spf) ctx.spf = spf;

  const goal = pickSingle(answers.goal, GOAL);
  if (goal) ctx.goal = goal;

  return Object.keys(ctx).length > 0 ? ctx : undefined;
}
