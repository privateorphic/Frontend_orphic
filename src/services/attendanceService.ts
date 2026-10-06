import api from './api';
import type { AttendanceRecord, AttendanceStatus, DailyAttendanceSummary, ApiResponse, LoginActivity } from '../types';

const ATTENDANCE_STORAGE_KEY = 'orphic_real_attendance_records_v1';

// Helper to get local user-maintained records
function getLocalRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper to save user-maintained records
function setLocalRecords(records: AttendanceRecord[]) {
  try {
    localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

// Helper to format LoginActivity to AttendanceRecord
export function mapLoginActivityToAttendance(la: LoginActivity): AttendanceRecord {
  const isLoggedOut = la.status === 'LOGGED_OUT';
  const hours = la.sessionDuration && la.sessionDuration.includes('h')
    ? parseFloat(la.sessionDuration.replace('h', '.').replace('m', '').trim()) || 8.0
    : isLoggedOut ? 8.0 : 0;

  return {
    id: la.id || `${la.employeeId}-${la.loginDate}`,
    employeeId: la.employeeId || 'EMP',
    employeeName: la.employeeName || 'Employee',
    departmentName: la.departmentName || 'General',
    date: la.loginDate || new Date().toISOString().slice(0, 10),
    attendanceDate: la.loginDate || new Date().toISOString().slice(0, 10),
    status: 'PRESENT',
    checkInTime: la.loginTime || '—',
    checkOutTime: la.logoutTime || '—',
    workingHours: hours,
    remarks: isLoggedOut ? 'System Logged Session' : 'Active Session',
  };
}

export const attendanceService = {
  // Get attendance records for a specific date (real API + user maintained)
  getDailyAttendance: async (dateStr?: string): Promise<AttendanceRecord[]> => {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);
    const local = getLocalRecords().filter((r) => (r.date || r.attendanceDate) === targetDate);

    try {
      const res = await api.get<ApiResponse<any>>('/hr/attendance', { params: { date: targetDate } });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        // Merge API data with local records
        const apiRecords: AttendanceRecord[] = res.data.data.map((item: any) =>
          item.status ? item : mapLoginActivityToAttendance(item)
        );
        const map = new Map<string, AttendanceRecord>();
        apiRecords.forEach((r) => map.set(String(r.employeeId), r));
        local.forEach((r) => map.set(String(r.employeeId), r));
        return Array.from(map.values());
      }
    } catch {
      // API call failed or endpoint empty
    }

    try {
      // Fallback to fetch actual login activity for target date
      const loginRes = await api.get<ApiResponse<any>>('/hr/login-activity', { params: { date: targetDate } });
      const activities: LoginActivity[] = Array.isArray(loginRes.data?.data)
        ? loginRes.data.data
        : Array.isArray(loginRes.data?.data?.content)
        ? loginRes.data.data.content
        : [];

      if (activities.length > 0) {
        const mapped = activities.map(mapLoginActivityToAttendance);
        const map = new Map<string, AttendanceRecord>();
        mapped.forEach((r) => map.set(String(r.employeeId), r));
        local.forEach((r) => map.set(String(r.employeeId), r));
        return Array.from(map.values());
      }
    } catch {
      // fallback
    }

    return local;
  },

  // Get attendance records for a specific employee profile
  getEmployeeAttendance: async (employeeId: string, monthStr?: string): Promise<AttendanceRecord[]> => {
    const currentMonth = monthStr || new Date().toISOString().slice(0, 7); // YYYY-MM
    const local = getLocalRecords().filter((r) => String(r.employeeId) === String(employeeId) && ((r.date || r.attendanceDate || '').startsWith(currentMonth)));

    try {
      const res = await api.get<ApiResponse<any>>(`/hr/login-activity/employee/${employeeId}`);
      const activities: LoginActivity[] = Array.isArray(res.data?.data) ? res.data.data : [];
      const monthActivities = activities.filter((la) => (la.loginDate || '').startsWith(currentMonth));

      if (monthActivities.length > 0) {
        const mapped = monthActivities.map(mapLoginActivityToAttendance);
        const map = new Map<string, AttendanceRecord>();
        mapped.forEach((r) => map.set(r.date || r.attendanceDate || '', r));
        local.forEach((r) => map.set(r.date || r.attendanceDate || '', r));
        return Array.from(map.values()).sort((a, b) => ((a.date || a.attendanceDate || '') < (b.date || b.attendanceDate || '') ? 1 : -1));
      }
    } catch {
      // fallback
    }

    return local.sort((a, b) => ((a.date || a.attendanceDate || '') < (b.date || b.attendanceDate || '') ? 1 : -1));
  },

  // Maintain / Save attendance record
  saveAttendanceRecord: async (record: {
    employeeId: string;
    employeeName: string;
    departmentName?: string;
    jobTitle?: string;
    date: string;
    status: AttendanceStatus;
    checkInTime?: string;
    checkOutTime?: string;
    workingHours?: number;
    remarks?: string;
  }): Promise<AttendanceRecord> => {
    const local = getLocalRecords();
    const existingIndex = local.findIndex((r) => r.employeeId === record.employeeId && r.date === record.date);

    const updatedRecord: AttendanceRecord = {
      id: existingIndex >= 0 ? local[existingIndex].id : Date.now(),
      ...record,
      updatedBy: 'HR Manager',
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      local[existingIndex] = updatedRecord;
    } else {
      local.unshift(updatedRecord);
    }

    setLocalRecords(local);

    try {
      await api.post('/hr/attendance', updatedRecord);
    } catch {
      // local fallback ensures instant state UI update
    }

    return updatedRecord;
  },

  // ===== NEW DAILY ATTENDANCE & TASK TRACKING ENDPOINTS =====
  checkIn: async (request: { latitude: number; longitude: number }): Promise<AttendanceRecord> => {
    const res = await api.post<ApiResponse<AttendanceRecord>>('/attendance/check-in', request);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Check-in failed');
    }
    return res.data.data;
  },

  checkOut: async (request?: { latitude?: number; longitude?: number }): Promise<AttendanceRecord> => {
    const res = await api.post<ApiResponse<AttendanceRecord>>('/attendance/check-out', request || {});
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Check-out failed');
    }
    return res.data.data;
  },

  wfhCheckIn: async (request: { latitude: number; longitude: number }): Promise<AttendanceRecord> => {
    const res = await api.post<ApiResponse<AttendanceRecord>>('/attendance/wfh/check-in', request);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'WFH Check-in failed');
    }
    return res.data.data;
  },

  endWorkDay: async (request?: { latitude?: number; longitude?: number }): Promise<AttendanceRecord> => {
    const res = await api.post<ApiResponse<AttendanceRecord>>('/attendance/end-work-day', request || {});
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'End Work Day failed');
    }
    return res.data.data;
  },

  getTodayAttendance: async (): Promise<DailyAttendanceSummary> => {
    const res = await api.get<ApiResponse<DailyAttendanceSummary>>('/attendance/today');
    if (res.data?.data) {
      return res.data.data;
    }
    return {
      attendanceDate: new Date().toISOString().slice(0, 10),
      status: 'NOT_STARTED',
      morningTaskCount: 0,
      tasksAdded: 0,
      finalTaskCount: 0,
      completedTaskCount: 0,
      inProgressTaskCount: 0,
      pendingTaskCount: 0,
    };
  },

  getAdminAttendanceList: async (dateStr?: string, page: number = 0, size: number = 20) => {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);
    try {
      const res = await api.get<ApiResponse<any>>('/admin/attendance', {
        params: { date: targetDate, page, size },
      });
      if (res.data?.data) {
        const data = res.data.data;
        return {
          content: Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : [],
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || (Array.isArray(data) ? data.length : 0),
        };
      }
    } catch {
      try {
        const resHr = await api.get<ApiResponse<any>>('/hr/attendance', {
          params: { date: targetDate, page, size },
        });
        if (resHr.data?.data) {
          const data = resHr.data.data;
          return {
            content: Array.isArray(data.content) ? data.content : Array.isArray(data) ? data : [],
            totalPages: data.totalPages || 1,
            totalElements: data.totalElements || (Array.isArray(data) ? data.length : 0),
          };
        }
      } catch (err) {
        console.error('Failed to load HR attendance list:', err);
      }
    }
    return { content: [], totalPages: 1, totalElements: 0 };
  },

  getEmployeeDailyActivity: async (employeeId: number | string, dateStr?: string) => {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);
    const res = await api.get<ApiResponse<any>>(`/admin/attendance/employee/${employeeId}`, {
      params: { date: targetDate },
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to load daily activity');
    }
    return res.data.data;
  },

  reopenAttendanceDay: async (attendanceId: number): Promise<AttendanceRecord> => {
    const res = await api.post<ApiResponse<AttendanceRecord>>(`/admin/attendance/${attendanceId}/reopen`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to reopen attendance day');
    }
    return res.data.data;
  },
};

