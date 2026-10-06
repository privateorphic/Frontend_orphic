import api from './api';
import type { AdminDashboard, HrDashboard, EmployeeDashboard, ApiResponse } from '../types';

export const dashboardService = {
  getAdminDashboard: async (): Promise<AdminDashboard> => {
    const res = await api.get<ApiResponse<AdminDashboard>>('/admin/dashboard');
    return res.data.data!;
  },

  getHrDashboard: async (): Promise<HrDashboard> => {
    const res = await api.get<ApiResponse<HrDashboard>>('/hr/dashboard');
    return res.data.data!;
  },

  getEmployeeDashboard: async (): Promise<EmployeeDashboard> => {
    const res = await api.get<ApiResponse<EmployeeDashboard>>('/employee/dashboard');
    return res.data.data!;
  },
};
