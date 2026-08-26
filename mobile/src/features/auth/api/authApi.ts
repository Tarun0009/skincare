import { api } from '../../../core/http/api';
import { secureStorage } from '../../../core/storage/secure';
import { setCredentials } from '../state/authSlice';
import type { AuthResponse } from '@shared/types';

interface Credentials {
  email: string;
  password: string;
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<AuthResponse, Credentials>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        await secureStorage.saveAuth(data);
        dispatch(setCredentials(data));
      },
    }),
    login: build.mutation<AuthResponse, Credentials>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        await secureStorage.saveAuth(data);
        dispatch(setCredentials(data));
      },
    }),
  }),
});

export const { useRegisterMutation, useLoginMutation } = authApi;
