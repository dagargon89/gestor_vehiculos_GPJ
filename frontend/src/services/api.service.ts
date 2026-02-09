import axios from 'axios';
import { auth } from '../config/firebase.config';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config) => {
    // #region agent log
    const base = config.baseURL ?? '';
    const url = config.url ?? '';
    fetch('http://127.0.0.1:7242/ingest/3ec9a792-d3fe-4b48-a3aa-58c6198082d5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api.service.ts:request', message: 'API request outgoing', data: { baseURL: base, url, full: base + (url.startsWith('/') ? url : '/' + url), VITE_API_URL: import.meta.env.VITE_API_URL ?? '(undefined)' }, timestamp: Date.now(), hypothesisId: 'H3' }) }).catch(() => {});
    // #endregion
    const user = auth?.currentUser ?? null;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3ec9a792-d3fe-4b48-a3aa-58c6198082d5', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api.service.ts:responseError', message: 'API response error', data: { message: error?.message ?? 'unknown', status: error?.response?.status, hasResponse: !!error?.response, configUrl: error?.config?.url }, timestamp: Date.now(), hypothesisId: 'H1,H4' }) }).catch(() => {});
    // #endregion
    if (error.response?.status === 401 && auth) {
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(error.config);
        } catch {
          await auth.signOut();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
