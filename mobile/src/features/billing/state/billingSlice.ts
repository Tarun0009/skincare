import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Plan = 'free' | 'trial' | 'monthly' | 'yearly';

export interface BillingState {
  plan: Plan;
  trialEndsAt: string | null;
  renewsAt: string | null;
}

const initialState: BillingState = {
  plan: 'free',
  trialEndsAt: null,
  renewsAt: null,
};

export const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setPlan(state, action: PayloadAction<Partial<BillingState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setPlan } = billingSlice.actions;
export default billingSlice.reducer;
