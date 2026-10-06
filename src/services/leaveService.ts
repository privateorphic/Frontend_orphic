import api from './api';
import type { LeaveRequest, LeaveRequestInput, ApiResponse } from '../types';

const extractArray = (data: any): LeaveRequest[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
};

export const leaveService = {
  // Employee
  applyLeave: async (data: LeaveRequestInput): Promise<LeaveRequest> => {
    const res = await api.post<ApiResponse<LeaveRequest>>('/employee/leaves', data);
    return res.data.data!;
  },

  getMyLeaves: async (): Promise<LeaveRequest[]> => {
    const res = await api.get<ApiResponse<any>>('/employee/leaves');
    return extractArray(res.data.data);
  },

  cancelLeave: async (id: number): Promise<LeaveRequest> => {
    const res = await api.patch<ApiResponse<LeaveRequest>>(`/employee/leaves/${id}/cancel`);
    return res.data.data!;
  },

  // HR
  getAllLeaves: async (status?: string): Promise<LeaveRequest[]> => {
    const res = await api.get<ApiResponse<any>>('/hr/leaves', {
      params: status ? { status } : {},
    });
    return extractArray(res.data.data);
  },

  approveLeave: async (id: number, comments?: string): Promise<LeaveRequest> => {
    const res = await api.post<ApiResponse<LeaveRequest>>(`/hr/leaves/${id}/approve`, { comments });
    return res.data.data!;
  },

  rejectLeave: async (id: number, comments?: string): Promise<LeaveRequest> => {
    const res = await api.post<ApiResponse<LeaveRequest>>(`/hr/leaves/${id}/reject`, { comments });
    return res.data.data!;
  },
};
