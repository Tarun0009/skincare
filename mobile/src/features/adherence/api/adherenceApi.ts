import { api } from '../../../core/http/api';
import type { CheckMap } from '../state/adherenceSlice';

/**
 * Endpoints for the persistent adherence table. The mobile Redux slice
 * remains the UI source of truth (optimistic updates feel instant); this API
 * layer just mirrors Redux edits to Postgres so streaks survive reinstalls.
 */
export const adherenceApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdherence: build.query<{ checks: CheckMap }, void>({
      query: () => ({ url: '/adherence' }),
    }),
    putAdherenceDay: build.mutation<void, { date: string; stepIds: string[] }>({
      query: ({ date, stepIds }) => ({
        url: `/adherence/${date}`,
        method: 'PUT',
        body: { stepIds },
      }),
    }),
  }),
});

export const { useGetAdherenceQuery, usePutAdherenceDayMutation } = adherenceApi;
