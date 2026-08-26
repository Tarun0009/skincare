import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { env } from '../config/env';
import { logout } from '../../features/auth/state/authSlice';
import type { RootState } from '../../store/types';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * Wrap the base query so a 401 triggers a global logout. Screens don't need
 * to handle expired tokens themselves.
 */
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    api.dispatch(logout());
  }
  return result;
};
