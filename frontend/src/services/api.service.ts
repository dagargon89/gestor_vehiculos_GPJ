import axios from 'axios';
import { auth } from '../config/firebase.config';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config) => {
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
    if (error.response?.status === 401 && auth) {
      const user = auth.currentUser;
      if (user) {
        try {
          const newToken = await user.getIdToken(true);
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return apiClient.request(error.config);
        } catch {
          return Promise.reject(error);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
