import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingState {
  /** questionId -> selected value(s). Single-select stores a string; multi stores string[]. */
  answers: Record<string, string | string[]>;
  completed: boolean;
}

const initialState: OnboardingState = {
  answers: {},
  completed: false,
};

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
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
      return initialState;
    },
  },
});

export const { setAnswer, completeOnboarding, resetOnboarding } = onboardingSlice.actions;
export default onboardingSlice.reducer;
