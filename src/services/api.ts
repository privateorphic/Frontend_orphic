import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401/403 and Network Errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (!error.response) {
      error.message = `Network Error: Backend server is not responding (${BASE_URL}). If using Render free tier, the backend may take 30-50 seconds to wake up.`;
    } else if (error.response.data) {
      const data = error.response.data as any;
      if (data.errors && typeof data.errors === 'object') {
        const fieldErrorMsgs = Object.values(data.errors).filter(Boolean).join('. ');
        error.message = fieldErrorMsgs || data.message || 'Validation failed';
      } else if (data.message) {
        error.message = data.message;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
