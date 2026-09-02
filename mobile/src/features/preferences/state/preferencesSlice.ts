import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface PreferencesState {
  showConfidence: boolean;
  photosOnDeviceOnly: boolean;
  blurInAppSwitcher: boolean;
  /** Master switch for the local AM/PM routine reminders. */
  remindersEnabled: boolean;
  /** 24-hour local-time hour for the morning reminder (0-23). */
  amHour: number;
  amMinute: number;
  /** 24-hour local-time hour for the evening reminder (0-23). */
  pmHour: number;
  pmMinute: number;
}

const initialState: PreferencesState = {
  showConfidence: true,
  photosOnDeviceOnly: true,
  blurInAppSwitcher: true,
  remindersEnabled: false,
  amHour: 8,
  amMinute: 0,
  pmHour: 21,
  pmMinute: 0,
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
    setReminderTime(
      state,
      action: PayloadAction<{ slot: 'am' | 'pm'; hour: number; minute: number }>
    ) {
      const { slot, hour, minute } = action.payload;
      if (slot === 'am') {
        state.amHour = hour;
        state.amMinute = minute;
      } else {
        state.pmHour = hour;
        state.pmMinute = minute;
      }
    },
  },
});

export const { setPreference, setReminderTime } = preferencesSlice.actions;
export default preferencesSlice.reducer;
