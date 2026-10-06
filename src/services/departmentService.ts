import api from './api';
import type { Department, ApiResponse } from '../types';

export const departmentService = {
  getAll: async (): Promise<Department[]> => {
    try {
      // Try HR endpoint first, then fallback to admin endpoint
      let res;
      try {
        res = await api.get<ApiResponse<any>>('/hr/departments');
      } catch {
        res = await api.get<ApiResponse<any>>('/admin/departments');
      }

      const data = res.data.data;
      if (!data) return [];
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.content)) return data.content;
      return [];
    } catch {
      return [];
    }
  },
};
