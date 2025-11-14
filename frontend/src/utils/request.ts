import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  removeAccessToken,
  removeRefreshToken,
  setAccessToken,
} from './token';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const request = axios.create({
  baseURL,
});

export const requestWithoutAuth = axios.create({
  baseURL,
});

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
request.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshTokenValue = getRefreshToken();
        if (!refreshTokenValue) {
          throw new Error('No refresh token');
        }

        const { data } = await requestWithoutAuth.post<{
          status: string;
          data: { accessToken: string };
        }>('/api/auth/refresh-token', {
          refreshToken: refreshTokenValue,
        });

        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = data.data.accessToken;

        return request(originalRequest);
      } catch (refreshError) {
        removeAccessToken();
        removeRefreshToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);







