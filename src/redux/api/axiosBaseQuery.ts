import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosRequestConfig, AxiosError } from 'axios';
import api from '../../services/api';

/**
 * Wraps the app's existing Axios instance (auth-token interceptor, 401
 * handling, timeout) so RTK Query endpoints hit the exact same HTTP
 * layer as every other service call — no second client, no behavior
 * change, just a cache in front of it.
 */
const axiosBaseQuery =
  (): BaseQueryFn<
    { url: string; method?: AxiosRequestConfig['method']; data?: unknown; params?: unknown },
    unknown,
    { status?: number; data: unknown }
  > =>
  async ({ url, method = 'get', data, params }) => {
    try {
      const result = await api({ url, method, data, params });
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export default axiosBaseQuery;
