import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PreferencesState {
  showConfidence: boolean;
  photosOnDeviceOnly: boolean;
  blurInAppSwitcher: boolean;
}

const initialState: PreferencesState = {
  showConfidence: true,
  photosOnDeviceOnly: true,
  blurInAppSwitcher: true,
};

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setPreference<K extends keyof PreferencesState>(
      state: PreferencesState,
      action: PayloadAction<{ key: K; value: PreferencesState[K] }>
    ) {
      state[action.payload.key] = action.payload.value;
    },
  },
});

export const { setPreference } = preferencesSlice.actions;
export default preferencesSlice.reducer;
