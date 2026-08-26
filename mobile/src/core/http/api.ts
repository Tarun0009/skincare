import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './baseQuery';

/**
 * Single RTK Query root API. Features add endpoints via `api.injectEndpoints`
 * from their own `api/*.ts` files so each feature owns its slice of the graph.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Scan', 'ScanList', 'Comparison'],
  endpoints: () => ({}),
});
