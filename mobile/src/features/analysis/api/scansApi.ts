import { api } from '../../../core/http/api';
import type { Comparison, Scan, ScanSummary } from '@shared/types';

interface UploadArgs {
  uri: string;
  fileName: string;
  type: string;
}

export const scansApi = api.injectEndpoints({
  endpoints: (build) => ({
    createScan: build.mutation<Scan, UploadArgs>({
      query: ({ uri, fileName, type }) => {
        const form = new FormData();
        // React Native FormData accepts { uri, name, type } — this is the
        // idiomatic upload pattern for RN.
        form.append('photo', {
          uri,
          name: fileName,
          type,
        } as unknown as Blob);
        return {
          url: '/scans',
          method: 'POST',
          body: form,
          formData: true,
          // Image preparation + Gemini analysis legitimately takes longer
          // than the short timeout used by ordinary list/detail requests.
          timeout: 90_000,
        };
      },
      invalidatesTags: ['ScanList', 'Comparison'],
    }),

    listScans: build.query<{ scans: ScanSummary[] }, { limit?: number } | void>({
      query: (args) => ({
        url: '/scans',
        params: args ?? undefined,
      }),
      providesTags: ['ScanList'],
    }),

    getScan: build.query<Scan, string>({
      query: (id) => ({ url: `/scans/${id}` }),
      providesTags: (_res, _err, id) => [{ type: 'Scan', id }],
    }),

    compareLatest: build.query<Comparison, void>({
      query: () => ({ url: '/scans/compare/latest' }),
      providesTags: ['Comparison'],
    }),
  }),
});

export const {
  useCreateScanMutation,
  useListScansQuery,
  useGetScanQuery,
  useCompareLatestQuery,
} = scansApi;
