import { api } from '../../../core/http/api';

export interface AccountDeletionSummary {
  scansDeleted: number;
  photosDeleted: number;
  photosFailed: number;
  firebaseUserDeleted: boolean;
}

/**
 * DELETE /me — erases the authenticated user's data across Cloudinary,
 * Postgres and Firebase. Invalidates every server-owned tag on success so
 * any lingering RTK cache (scans, comparison, etc.) is wiped alongside.
 */
export const accountApi = api.injectEndpoints({
  endpoints: (build) => ({
    deleteAccount: build.mutation<AccountDeletionSummary, void>({
      query: () => ({ url: '/me', method: 'DELETE' }),
      invalidatesTags: ['Scan', 'ScanList', 'Comparison'],
    }),
  }),
});

export const { useDeleteAccountMutation } = accountApi;
