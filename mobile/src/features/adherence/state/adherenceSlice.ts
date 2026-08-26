import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** ISO date (YYYY-MM-DD) -> set of completed step ids. */
export type CheckMap = Record<string, string[]>;

export interface AdherenceState {
  checks: CheckMap;
  streakStart: string | null;
}

const initialState: AdherenceState = {
  checks: {},
  streakStart: null,
};

export const adherenceSlice = createSlice({
  name: 'adherence',
  initialState,
  reducers: {
    toggleStep(state, action: PayloadAction<{ date: string; stepId: string }>) {
      const { date, stepId } = action.payload;
      const current = state.checks[date] ?? [];
      state.checks[date] = current.includes(stepId)
        ? current.filter((id) => id !== stepId)
        : [...current, stepId];
    },
    markStep(state, action: PayloadAction<{ date: string; stepId: string; done: boolean }>) {
      const { date, stepId, done } = action.payload;
      const current = state.checks[date] ?? [];
      state.checks[date] = done
        ? Array.from(new Set([...current, stepId]))
        : current.filter((id) => id !== stepId);
    },
  },
});

export const { toggleStep, markStep } = adherenceSlice.actions;
export default adherenceSlice.reducer;

/** Compute weekly bar values: [Mon..Sun] each 0..1 based on how many of the routine steps got done. */
export function computeWeekProgress(
  checks: CheckMap,
  stepsPerDay: number,
  weekStart: Date
): number[] {
  const out: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const done = checks[key]?.length ?? 0;
    out.push(stepsPerDay > 0 ? Math.min(1, done / stepsPerDay) : 0);
  }
  return out;
}

/** Compute streak: consecutive days with at least one check, counting back from today. */
export function computeStreak(checks: CheckMap, today: Date): number {
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if ((checks[key]?.length ?? 0) > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}
