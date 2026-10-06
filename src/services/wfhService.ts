import api from './api';
import type { WfhRequestInput, WfhResponse, WfhActiveEmployee, ApiResponse } from '../types';

export const wfhService = {
  // Submit WFH request
  createWfhRequest: async (input: WfhRequestInput): Promise<WfhResponse> => {
    const res = await api.post<ApiResponse<WfhResponse>>('/wfh/requests', input);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to submit WFH request');
    }
    return res.data.data;
  },

  // Get current user's WFH requests
  getMyWfhRequests: async (): Promise<WfhResponse[]> => {
    const res = await api.get<ApiResponse<WfhResponse[]>>('/wfh/my-requests');
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  // Check if today has an approved WFH request
  checkWfhApprovalForToday: async (): Promise<{ isApproved: boolean; request?: WfhResponse }> => {
    const requests = await wfhService.getMyWfhRequests();
    const todayStr = new Date().toISOString().slice(0, 10);
    const approvedToday = requests.find(
      (r) => r.status === 'APPROVED' && r.date === todayStr
    );
    return { isApproved: !!approvedToday, request: approvedToday };
  },

  // Get all WFH requests for HR/Admin
  getAllWfhRequests: async (dateStr?: string, status?: string): Promise<WfhResponse[]> => {
    const res = await api.get<ApiResponse<any>>('/wfh/requests', {
      params: { date: dateStr, status },
    });
    if (res.data?.data) {
      const data = res.data.data;
      if (Array.isArray(data.content)) return data.content;
      if (Array.isArray(data)) return data;
    }
    return [];
  },

  // Approve WFH request
  approveWfhRequest: async (id: number, comments?: string): Promise<WfhResponse> => {
    const res = await api.patch<ApiResponse<WfhResponse>>(`/wfh/requests/${id}/approve`, { comments });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to approve WFH request');
    }
    return res.data.data;
  },

  // Reject WFH request
  rejectWfhRequest: async (id: number, rejectionReason?: string): Promise<WfhResponse> => {
    const res = await api.patch<ApiResponse<WfhResponse>>(`/wfh/requests/${id}/reject`, { rejectionReason });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to reject WFH request');
    }
    return res.data.data;
  },

  // Cancel WFH request
  cancelWfhRequest: async (id: number): Promise<WfhResponse> => {
    const res = await api.patch<ApiResponse<WfhResponse>>(`/wfh/requests/${id}/cancel`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to cancel WFH request');
    }
    return res.data.data;
  },

  // Send periodic WFH location update
  recordLocation: async (latitude: number, longitude: number, accuracyMeters?: number): Promise<void> => {
    await api.post('/wfh/location', { latitude, longitude, accuracyMeters });
  },

  // Get latest location for employee (HR/Admin)
  getLatestLocation: async (employeeId: number | string): Promise<WfhActiveEmployee> => {
    const res = await api.get<ApiResponse<WfhActiveEmployee>>(`/wfh/location/latest/${employeeId}`);
    if (!res.data?.data) {
      throw new Error(res.data?.message || 'No location data found');
    }
    return res.data.data;
  },

  // Get active WFH employees today (Admin/HR)
  getActiveWfhEmployees: async (): Promise<WfhActiveEmployee[]> => {
    const res = await api.get<ApiResponse<WfhActiveEmployee[]>>('/admin/wfh/active');
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return [];
  },

  // WFH Check-In
  wfhCheckIn: async (request: { latitude: number; longitude: number }): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/attendance/wfh/check-in', request);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'WFH Check-in failed');
    }
    return res.data.data;
  },

  // End Work Day
  endWorkDay: async (request?: { latitude?: number; longitude?: number }): Promise<any> => {
    const res = await api.post<ApiResponse<any>>('/attendance/end-work-day', request || {});
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'End Work Day failed');
    }
    return res.data.data;
  },
};
