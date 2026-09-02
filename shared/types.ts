export type ConditionType =
  | 'acne'
  | 'dryness'
  | 'oiliness'
  | 'pigmentation'
  | 'redness'
  | 'wrinkles'
  | 'pores'
  | 'dark_circles';

export type FaceRegion = 'forehead' | 'cheeks' | 'nose' | 'chin' | 'jawline';

export type Severity = 0 | 1 | 2 | 3 | 4 | 5;

export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';

export interface ConditionScore {
  type: ConditionType;
  severity: Severity;
  confidence: number;
  locations: FaceRegion[];
  notes: string;
}

export interface SkinAnalysis {
  skinType: SkinType;
  overallScore: number;
  conditions: ConditionScore[];
  summary: string;
  disclaimer: string;
}

export type ProductCategory =
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'moisturizer'
  | 'sunscreen'
  | 'treatment';

export interface RoutineStep {
  order: number;
  timeOfDay: 'am' | 'pm' | 'both';
  category: ProductCategory;
  productName: string;
  ingredientsToLookFor: string[];
  reason: string;
}

export interface Routine {
  am: RoutineStep[];
  pm: RoutineStep[];
  warnings: string[];
}

export interface Scan {
  id: string;
  userId: string;
  photoUrl: string;
  createdAt: string;
  analysis: SkinAnalysis;
  routine: Routine;
}

export interface ScanSummary {
  id: string;
  createdAt: string;
  overallScore: number;
  thumbnailUrl: string;
}

export interface Comparison {
  baselineScanId: string;
  currentScanId: string;
  improvementScore: number;
  perConditionDelta: Partial<Record<ConditionType, number>>;
  narrative: string;
}

export const ALL_CONDITIONS: ConditionType[] = [
  'acne',
  'dryness',
  'oiliness',
  'pigmentation',
  'redness',
  'wrinkles',
  'pores',
  'dark_circles',
];

/**
 * Onboarding-questionnaire answers, normalized for the analysis prompt. The
 * mobile client builds this from Redux state and sends it alongside the scan
 * photo. Every field is optional so the server tolerates partial data — a user
 * who skipped the quiz still gets a valid (less personalized) analysis.
 */
export type SelfReportedSkinType = 'dry' | 'combination' | 'oily' | 'normal';
export type PrimaryConcern = 'acne' | 'pigmentation' | 'aging' | 'sensitivity' | 'unsure';
export type ActiveHistory = 'retinoid' | 'aha_bha' | 'rx' | 'none';
export type ReactivityLevel = 'rarely' | 'sometimes' | 'often';
export type SpfFrequency = 'daily' | 'sometimes' | 'rarely' | 'never';
export type EightWeekGoal = 'clearer' | 'even' | 'smoother' | 'calmer';

export interface OnboardingContext {
  selfReportedSkinType?: SelfReportedSkinType;
  primaryConcerns?: PrimaryConcern[];
  activeHistory?: ActiveHistory[];
  reactivity?: ReactivityLevel;
  spf?: SpfFrequency;
  goal?: EightWeekGoal;
}

export const CONDITION_LABEL: Record<ConditionType, string> = {
  acne: 'Acne',
  dryness: 'Dryness',
  oiliness: 'Oiliness',
  pigmentation: 'Pigmentation',
  redness: 'Redness',
  wrinkles: 'Wrinkles',
  pores: 'Enlarged Pores',
  dark_circles: 'Dark Circles',
};
