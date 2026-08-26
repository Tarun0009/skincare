import type { ConditionScore, Severity } from '@shared/types';

export type SeverityTone = 'sage' | 'gold' | 'coral';

export interface SeverityBucket {
  label: string;
  tone: SeverityTone;
  /** 0..100 percent to fill a bar with */
  percent: number;
}

const BUCKETS: Record<Severity, SeverityBucket> = {
  0: { label: 'None', tone: 'sage', percent: 8 },
  1: { label: 'Minimal', tone: 'sage', percent: 22 },
  2: { label: 'Mild', tone: 'gold', percent: 37 },
  3: { label: 'Mild–moderate', tone: 'gold', percent: 52 },
  4: { label: 'Moderate', tone: 'coral', percent: 68 },
  5: { label: 'Severe', tone: 'coral', percent: 88 },
};

export function bucketForSeverity(sev: Severity): SeverityBucket {
  return BUCKETS[sev];
}

export function severityLabel(sev: Severity): string {
  return BUCKETS[sev].label;
}

/** Rough numeric score for display (severity translated to /100). */
export function severityScore(sev: Severity): number {
  return BUCKETS[sev].percent;
}

/** Sort so the loudest findings come first. */
export function sortByImpact(conditions: ConditionScore[]): ConditionScore[] {
  return [...conditions].sort((a, b) => b.severity - a.severity);
}
