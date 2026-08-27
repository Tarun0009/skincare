import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * Auth state mirrors the Firebase user. AuthGate subscribes to
 * `onAuthStateChanged` and pushes the current user in here so the rest of the
 * app (RTK Query, RootNavigator) can react synchronously.
 *
 * We deliberately don't cache tokens here — baseQuery pulls a fresh ID token
 * from Firebase on every request via `getIdToken()`, so there's no stale-token
 * problem to manage in Redux.
 */

export interface AuthState {
  uid: string | null;
  email: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  uid: null,
  email: null,
  hydrated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setFirebaseUser(
      state,
      action: PayloadAction<{ uid: string; email: string | null } | null>
    ) {
      state.hydrated = true;
      if (action.payload) {
        state.uid = action.payload.uid;
        state.email = action.payload.email;
      } else {
        state.uid = null;
        state.email = null;
      }
    },
    logout(state) {
      state.uid = null;
      state.email = null;
    },
  },
});

export const { setFirebaseUser, logout } = authSlice.actions;
export default authSlice.reducer;
