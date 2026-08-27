import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '../core/http/api';
import authReducer from '../features/auth/state/authSlice';
import onboardingReducer from '../features/onboarding/state/onboardingSlice';
import preferencesReducer from '../features/preferences/state/preferencesSlice';
import adherenceReducer from '../features/adherence/state/adherenceSlice';
import billingReducer from '../features/billing/state/billingSlice';

// Feature endpoints must be imported for their injectEndpoints() call to run
// before the store is created — otherwise their generated hooks are undefined.
// Auth endpoints were removed when we moved to Firebase; only scans left.
import '../features/analysis/api/scansApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
    preferences: preferencesReducer,
    adherence: adherenceReducer,
    billing: billingReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefault) =>
    getDefault({
      // File uploads through FormData carry non-serializable values; that's fine.
      serializableCheck: {
        ignoredActions: ['api/executeMutation/pending'],
      },
    }).concat(api.middleware),
});

setupListeners(store.dispatch);
