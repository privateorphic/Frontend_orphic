import api from './api';
import type { Notification, ApiResponse } from '../types';

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const res = await api.get<ApiResponse<any>>('/employee/notifications');
    return res.data.data?.content ?? res.data.data ?? [];
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<number>>('/employee/notifications/unread-count');
    return res.data.data ?? 0;
  },

  markRead: async (id: number): Promise<void> => {
    await api.patch(`/employee/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/employee/notifications/mark-all-read');
  },
};
