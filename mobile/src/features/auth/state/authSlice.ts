import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  token: null,
  userId: null,
  email: null,
  hydrated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; userId: string; email: string }>
    ) {
      state.token = action.payload.token;
      state.userId = action.payload.userId;
      state.email = action.payload.email;
    },
    hydrated(
      state,
      action: PayloadAction<{ token: string; userId: string; email: string } | null>
    ) {
      state.hydrated = true;
      if (action.payload) {
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.email = action.payload.email;
      }
    },
    logout(state) {
      state.token = null;
      state.userId = null;
      state.email = null;
    },
  },
});

export const { setCredentials, hydrated, logout } = authSlice.actions;
export default authSlice.reducer;
