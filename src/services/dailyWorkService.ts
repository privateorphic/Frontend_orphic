import api from './api';
import type { DailyWork, DailyWorkRequest, ApiResponse } from '../types';

const extractArray = (data: any): DailyWork[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
};

export const dailyWorkService = {
  submitWork: async (data: DailyWorkRequest): Promise<DailyWork> => {
    const res = await api.post<ApiResponse<DailyWork>>('/employee/daily-work', data);
    return res.data.data!;
  },

  getMyWork: async (): Promise<DailyWork[]> => {
    const res = await api.get<ApiResponse<any>>('/employee/daily-work');
    return extractArray(res.data.data);
  },

  getWorkHistory: async (startDate?: string, endDate?: string): Promise<DailyWork[]> => {
    const res = await api.get<ApiResponse<any>>('/employee/work-history', {
      params: { startDate, endDate },
    });
    return extractArray(res.data.data);
  },

  // Admin/HR
  getAllWork: async (employeeId?: number, startDate?: string, endDate?: string): Promise<DailyWork[]> => {
    const res = await api.get<ApiResponse<any>>('/hr/reports/daily-work', {
      params: { employeeId, startDate, endDate },
    });
    return extractArray(res.data.data);
  },
};
