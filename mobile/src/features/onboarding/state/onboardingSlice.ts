import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { StoredOnboarding } from '../../../core/storage/secure';

export interface OnboardingState {
  /** questionId -> selected value(s). Single-select stores a string; multi stores string[]. */
  answers: Record<string, string | string[]>;
  completed: boolean;
  hydrated: boolean;
}

const initialState: OnboardingState = {
  answers: {},
  completed: false,
  hydrated: false,
};

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    hydrateOnboarding(state, action: PayloadAction<StoredOnboarding | null>) {
      state.answers = action.payload?.answers ?? {};
      state.completed = action.payload?.completed ?? false;
      state.hydrated = true;
    },
    setAnswer(
      state,
      action: PayloadAction<{ questionId: string; value: string | string[] }>
    ) {
      state.answers[action.payload.questionId] = action.payload.value;
    },
    completeOnboarding(state) {
      state.completed = true;
    },
    resetOnboarding() {
      return { ...initialState, hydrated: true };
    },
  },
});

export const { hydrateOnboarding, setAnswer, completeOnboarding, resetOnboarding } =
  onboardingSlice.actions;
export default onboardingSlice.reducer;
