import api from './api';
import type { LoginActivity, ApiResponse } from '../types';

const extractArray = (data: any): LoginActivity[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
};

export const loginActivityService = {
  // Admin
  getAll: async (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<LoginActivity[]> => {
    const res = await api.get<ApiResponse<any>>('/admin/login-activity', { params });
    return extractArray(res.data.data);
  },

  getToday: async (): Promise<LoginActivity[]> => {
    const res = await api.get<ApiResponse<any>>('/admin/login-activity/today');
    return extractArray(res.data.data);
  },

  getByEmployee: async (employeeId: string): Promise<LoginActivity[]> => {
    try {
      const res = await api.get<ApiResponse<any>>(
        `/hr/login-activity/employee/${employeeId}`
      );
      if (res.data.data) return extractArray(res.data.data);
    } catch {
      // Fallback to /admin endpoint
    }
    const res = await api.get<ApiResponse<any>>(
      `/admin/login-activity/employee/${employeeId}`
    );
    return extractArray(res.data.data);
  },

  // HR
  hrGetAll: async (date?: string): Promise<LoginActivity[]> => {
    const res = await api.get<ApiResponse<any>>('/hr/login-activity', {
      params: date ? { date } : {},
    });
    return extractArray(res.data.data);
  },

  hrGetByEmployee: async (employeeId: string): Promise<LoginActivity[]> => {
    const res = await api.get<ApiResponse<any>>(
      `/hr/login-activity/employee/${employeeId}`
    );
    return extractArray(res.data.data);
  },

  hrGetAttendance: async (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LoginActivity[]> => {
    const res = await api.get<ApiResponse<any>>('/hr/attendance', { params });
    return extractArray(res.data.data);
  },

  // Employee
  getMyHistory: async (): Promise<LoginActivity[]> => {
    const res = await api.get<ApiResponse<any>>('/employee/login-activity');
    return extractArray(res.data.data);
  },
};
