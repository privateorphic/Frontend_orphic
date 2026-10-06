import api from './api';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, ApiResponse } from '../types';

const extractArray = (data: any): Employee[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
};

export const employeeService = {
  // Admin
  getAllEmployees: async (): Promise<Employee[]> => {
    const res = await api.get<ApiResponse<any>>('/admin/employees');
    return extractArray(res.data.data);
  },

  getEmployeeById: async (id: number): Promise<Employee> => {
    try {
      const res = await api.get<ApiResponse<Employee>>(`/hr/employees/${id}`);
      if (res.data.data) return res.data.data;
    } catch {
      // Fallback for admin if /hr/ endpoint is unavailable
    }
    const res = await api.get<ApiResponse<Employee>>(`/admin/employees/${id}`);
    return res.data.data!;
  },

  updateEmployee: async (id: number, data: UpdateEmployeeRequest): Promise<Employee> => {
    const res = await api.put<ApiResponse<Employee>>(`/admin/employees/${id}`, data);
    return res.data.data!;
  },

  changeStatus: async (id: number, status: string): Promise<Employee> => {
    const res = await api.patch<ApiResponse<Employee>>(`/admin/employees/${id}/status`, null, {
      params: { status },
    });
    return res.data.data!;
  },

  createEmployee: async (data: CreateEmployeeRequest): Promise<Employee> => {
    try {
      const res = await api.post<ApiResponse<Employee>>('/admin/employees', data);
      if (res.data.data) return res.data.data;
    } catch {
      // Fallback to HR endpoint
    }
    const res = await api.post<ApiResponse<Employee>>('/hr/employees', data);
    return res.data.data!;
  },

  deleteEmployee: async (id: number): Promise<void> => {
    await api.delete(`/admin/employees/${id}`);
  },

  // HR
  hrGetAllEmployees: async (): Promise<Employee[]> => {
    const res = await api.get<ApiResponse<any>>('/hr/employees');
    return extractArray(res.data.data);
  },

  hrGetEmployee: async (id: number): Promise<Employee> => {
    const res = await api.get<ApiResponse<Employee>>(`/hr/employees/${id}`);
    return res.data.data!;
  },

  hrGetByEmployeeId: async (employeeId: string): Promise<Employee> => {
    const res = await api.get<ApiResponse<Employee>>(`/hr/employees/by-employee-id/${employeeId}`);
    return res.data.data!;
  },

  hrCreateEmployee: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const res = await api.post<ApiResponse<Employee>>('/hr/employees', data);
    return res.data.data!;
  },

  hrUpdateEmployee: async (id: number, data: UpdateEmployeeRequest): Promise<Employee> => {
    const res = await api.put<ApiResponse<Employee>>(`/hr/employees/${id}`, data);
    return res.data.data!;
  },

  // Employee (own profile)
  getMyProfile: async (): Promise<Employee> => {
    const res = await api.get<ApiResponse<Employee>>('/employee/profile');
    return res.data.data!;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    await api.post('/employee/change-password', data);
  },
};
