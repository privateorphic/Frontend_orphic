import api from './api';
import type { Task, TaskRequest, EmployeeTaskUpdateRequest, ApiResponse, TaskStatus, TaskPriority } from '../types';

const extractArray = (data: any): Task[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
};

export const taskService = {
  // Admin
  getAllTasks: async (params?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assignedToId?: number;
    departmentId?: number;
    keyword?: string;
  }): Promise<Task[]> => {
    const res = await api.get<ApiResponse<any>>('/admin/tasks', { params });
    return extractArray(res.data.data);
  },

  getTaskById: async (id: number): Promise<Task> => {
    const res = await api.get<ApiResponse<Task>>(`/admin/tasks/${id}`);
    return res.data.data!;
  },

  createTask: async (data: TaskRequest): Promise<Task> => {
    const res = await api.post<ApiResponse<Task>>('/admin/tasks', data);
    return res.data.data!;
  },

  updateTask: async (id: number, data: TaskRequest): Promise<Task> => {
    const res = await api.put<ApiResponse<Task>>(`/admin/tasks/${id}`, data);
    return res.data.data!;
  },

  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/admin/tasks/${id}`);
  },

  // Employee
  getMyTasks: async (status?: TaskStatus): Promise<Task[]> => {
    const res = await api.get<ApiResponse<any>>('/employee/tasks', {
      params: status ? { status } : {},
    });
    return extractArray(res.data.data);
  },

  createMyTask: async (data: TaskRequest): Promise<Task> => {
    const res = await api.post<ApiResponse<Task>>('/employee/tasks', data);
    return res.data.data!;
  },

  getMyTaskById: async (id: number): Promise<Task> => {
    const res = await api.get<ApiResponse<Task>>(`/employee/tasks/${id}`);
    return res.data.data!;
  },

  updateMyTask: async (id: number, data: EmployeeTaskUpdateRequest): Promise<Task> => {
    const res = await api.patch<ApiResponse<Task>>(`/employee/tasks/${id}`, data);
    return res.data.data!;
  },
};
