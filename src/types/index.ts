// =================== AUTH ===================
export interface AuthUser {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  department?: string;
  jobTitle?: string;
  status?: string;
  profileImage?: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  isOfficeLocation?: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

// =================== EMPLOYEE ===================
export type UserRole = 'ADMIN' | 'HR' | 'EMPLOYEE';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'FREELANCE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';

export interface Department {
  id: number;
  name: string;
  description?: string;
  headOfDepartment?: string;
  createdAt?: string;
}

export interface Employee {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  departmentId?: number;
  departmentName?: string;
  jobTitle?: string;
  joiningDate?: string;
  employmentType?: EmploymentType;
  status: UserStatus;
  address?: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  employeeId: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  departmentId?: number;
  jobTitle?: string;
  joiningDate?: string;
  employmentType?: EmploymentType;
  address?: string;
  profileImage?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  departmentId?: number;
  jobTitle?: string;
  joiningDate?: string;
  employmentType?: EmploymentType;
  status?: UserStatus;
  address?: string;
  profileImage?: string;
}

// =================== TASK ===================
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';

export interface Task {
  id: number;
  title: string;
  description?: string;
  assignedToId?: number;
  assignedToName?: string;
  assignedToEmployeeId?: string;
  createdById?: number;
  createdByName?: string;
  departmentId?: number;
  departmentName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  progressPercentage: number;
  startDate?: string;
  deadline?: string;
  completedAt?: string;
  workUpdate?: string;
  createdAt?: string;
  updatedAt?: string;
  overdue?: boolean;
}

export interface TaskRequest {
  title: string;
  description?: string;
  assignedToId?: number;
  departmentId?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  progressPercentage?: number;
  startDate?: string;
  deadline?: string;
}

export interface EmployeeTaskUpdateRequest {
  status?: TaskStatus;
  progressPercentage?: number;
  workUpdate?: string;
}

// =================== DAILY WORK ===================
export interface DailyWork {
  id: number;
  employeeId?: number;
  employeeName?: string;
  employeeCode?: string;
  taskId?: number;
  taskTitle?: string;
  workDate: string;
  description: string;
  hoursWorked?: number;
  progressPercentage?: number;
  status?: TaskStatus;
  notes?: string;
  reportFileName?: string;
  driveLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyWorkRequest {
  taskId?: number;
  workDate: string;
  description: string;
  hoursWorked?: number;
  progressPercentage?: number;
  status?: TaskStatus;
  notes?: string;
  reportFileName?: string;
  driveLink?: string;
}

// =================== LOGIN ACTIVITY ===================
export type LoginActivityStatus = 'ACTIVE' | 'LOGGED_OUT';

export interface LoginActivity {
  id: number;
  userId?: number;
  employeeId?: string;
  employeeName?: string;
  departmentName?: string;
  loginDate: string;
  loginTime: string;
  logoutTime?: string;
  sessionDuration?: string;
  status: LoginActivityStatus;
  ipAddress?: string;
  isOfficeLocation?: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

// =================== ATTENDANCE ===================
export type WorkMode = 'OFFICE' | 'WFH';
export type AttendanceStatus = 'NOT_STARTED' | 'CHECKED_IN' | 'WORKING' | 'CHECKED_OUT' | 'COMPLETED' | 'REOPENED' | 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'LATE';

export interface AttendanceRecord {
  id: number | string;
  employeeId: number | string;
  employeeName: string;
  employeeCode?: string;
  departmentName?: string;
  jobTitle?: string;
  attendanceDate?: string;
  date?: string;
  workMode?: WorkMode;
  isWfhApprovedToday?: boolean;
  morningCheckIn?: string;
  morningLatitude?: number;
  morningLongitude?: number;
  morningDistanceFromOffice?: number;
  eveningCheckOut?: string;
  eveningLatitude?: number;
  eveningLongitude?: number;
  eveningDistanceFromOffice?: number;
  status: AttendanceStatus;
  officeDuration?: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  remarks?: string;
  updatedBy?: string;
  updatedAt?: string;
}

// =================== LEAVE & WFH ===================
export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID' | 'WORK_FROM_HOME' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface LeaveRequest {
  id: number;
  employeeId?: number;
  employeeName?: string;
  employeeCode?: string;
  departmentName?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason: string;
  status: LeaveStatus;
  reviewedById?: number;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComments?: string;
  createdAt?: string;
}

export interface LeaveRequestInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface WfhRequestInput {
  date: string;
  reason: string;
  notes?: string;
}

export interface WfhResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode?: string;
  departmentName?: string;
  date: string;
  reason: string;
  notes?: string;
  status: LeaveStatus;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export interface WfhActiveEmployee {
  attendanceId?: number;
  employeeId: number;
  employeeName: string;
  employeeCode?: string;
  departmentName?: string;
  workMode: WorkMode;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  activeSessionTime?: string;
  totalTasks?: number;
  completedTasks?: number;
  lastLatitude?: number;
  lastLongitude?: number;
  lastAccuracyMeters?: number;
  lastCapturedAt?: string;
}

// =================== NOTIFICATION ===================
export type NotificationType =
  | 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMPLETED'
  | 'LEAVE_REQUEST' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED'
  | 'EMPLOYEE_CREATED' | 'SYSTEM';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  senderName?: string;
  entityType?: string;
  entityId?: number;
  createdAt?: string;
}

// =================== DASHBOARD ===================
export interface AdminDashboard {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  loggedInToday: number;
  activeSessions: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  cancelledTasks: number;
  pendingLeaveRequests: number;
  employeesOnLeave: number;
  taskStatusDistribution: Record<string, number>;
  departmentDistribution: Record<string, number>;
  weeklyTaskCompletion: Array<{ date: string; completed: number }>;
  dailyWorkHours: Array<{ date: string; hours: number }>;
  recentActivity: Array<Record<string, unknown>>;
}

export interface HrDashboard {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newEmployeesThisMonth: number;
  loggedInToday: number;
  employeesOnLeave: number;
  pendingLeaveRequests: number;
  departmentDistribution: Record<string, number>;
  leaveDistribution: Record<string, number>;
  attendanceTrend: Array<{ date: string; count: number }>;
  recentLeaveRequests: Array<Record<string, unknown>>;
}

export interface EmployeeDashboard {
  employee: Employee;
  todayLoginTime?: string;
  currentSessionDuration?: string;
  loggedInToday: boolean;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  todaysTasks: Task[];
  todayHoursWorked?: number;
  weekHoursWorked?: number;
  recentSessions: LoginActivity[];
}

// =================== API RESPONSE ===================
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  status?: number;
  timestamp?: string;
  error?: string;
}

// =================== PAGINATION ===================
export interface PaginationMeta {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

// =================== ATTENDANCE & TASK TRACKING ===================
export type ActivityActionType = 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'TASK_REOPENED' | 'TASK_STATUS_CHANGED' | 'TASK_PROGRESS_UPDATED' | 'TASK_NOTE_ADDED';

export interface CheckInRequest {
  latitude: number;
  longitude: number;
}

export interface CheckOutRequest {
  latitude?: number;
  longitude?: number;
}

export interface DailyAttendanceSummary {
  attendanceDate: string;
  status: AttendanceStatus;
  morningCheckIn?: string;
  eveningCheckOut?: string;
  officeDuration?: string;
  morningTaskCount: number;
  tasksAdded: number;
  finalTaskCount: number;
  completedTaskCount: number;
  inProgressTaskCount: number;
  pendingTaskCount: number;
}

export interface TaskSnapshot {
  id: number;
  taskId: number;
  taskTitle: string;
  taskStatus: TaskStatus;
  taskProgress: number;
  snapshotTime: string;
}

export interface TaskChanges {
  addedTasks: TaskSnapshot[];
  updatedTasks: TaskSnapshot[];
  completedTasks: TaskSnapshot[];
}

export interface TaskActivityTimeline {
  id: number;
  taskId: number;
  taskTitle: string;
  actionType: ActivityActionType;
  oldStatus?: string;
  newStatus?: string;
  oldProgress?: number;
  newProgress?: number;
  description?: string;
  createdAt: string;
}

export interface EmployeeDailyActivity {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  attendanceDate: string;
  attendance?: AttendanceRecord;
  summary?: DailyAttendanceSummary;
  morningTasks: TaskSnapshot[];
  eveningTasks: TaskSnapshot[];
  taskChanges: TaskChanges;
  timeline: TaskActivityTimeline[];
}

