import api from './api';
import type { LoginRequest, LoginResponse } from '../types';

export const authService = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const payload = {
      username: credentials.identifier || credentials.username,
      identifier: credentials.identifier || credentials.username,
      password: credentials.password,
      isOfficeLocation: credentials.isOfficeLocation ?? true,
      latitude: credentials.latitude,
      longitude: credentials.longitude,
      locationName: credentials.locationName,
    };
    const response = await api.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};
