import axios from 'axios';
import { parseApiError } from '@/lib/errors';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = parseApiError(error);
    if (apiError.isUnauthorized) {
      const url = error?.config?.url ?? '';
      if (!url.includes('/auth/me')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(apiError);
  },
);

export default api;
