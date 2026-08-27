import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { env } from '../config/env';
import { logout } from '../../features/auth/state/authSlice';
import { getIdToken, signOutCurrentUser } from '../../features/auth/lib/firebase';

// Guard against a stuck fetch — on Android the OS will happily let a request
// to an unreachable dev server hang indefinitely, which then locks screens on
// skeletons. `timeout` gives us a fast failure so the UI can show its empty
// state instead.
const REQUEST_TIMEOUT_MS = 8000;

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  prepareHeaders: async (headers) => {
    // Firebase caches unexpired tokens; getIdToken() is a fast local lookup
    // most of the time and does a network call only when the token is about
    // to expire.
    const token = await getIdToken();
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/**
 * On a 401 from the server we assume the Firebase ID token is truly rejected
 * (revoked, project mismatched, etc.) and sign the user out locally so the
 * next render sends them back to Login.
 */
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    await signOutCurrentUser().catch(() => undefined);
    api.dispatch(logout());
  }
  return result;
};
