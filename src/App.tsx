import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastContainer } from './components/common/Toast.tsx';
import { AdminRoute, HRRoute, EmployeeRoute } from './routes/index.tsx';

// Layouts
import AuthLayout from './layouts/AuthLayout.tsx';
import AdminLayout from './layouts/AdminLayout.tsx';
import HRLayout from './layouts/HRLayout.tsx';
import EmployeeLayout from './layouts/EmployeeLayout.tsx';

// Auth
import LoginPage from './pages/auth/LoginPage.tsx';

// Admin
import AdminDashboardPage from './pages/admin/Dashboard.tsx';
import AdminEmployeesPage from './pages/admin/Employees.tsx';
import AdminEmployeeDetailPage from './pages/admin/EmployeeDetail.tsx';
import AdminTasksPage from './pages/admin/Tasks.tsx';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage.tsx';
import AdminLoginActivityPage from './pages/admin/LoginActivity.tsx';
import AdminReportsPage from './pages/admin/Reports.tsx';

// HR
import HrDashboardPage from './pages/hr/Dashboard.tsx';
import HrEmployeesPage from './pages/hr/Employees.tsx';
import HrCreateEmployeePage from './pages/hr/CreateEmployee.tsx';
import { HrAttendancePage } from './pages/hr/HrAttendancePage.tsx';
import HrLeavesPage from './pages/hr/Leaves.tsx';

// Employee
import EmployeeDashboardPage from './pages/employee/Dashboard.tsx';
import EmployeeTasksPage from './pages/employee/Tasks.tsx';
import EmployeeTaskDetailPage from './pages/employee/TaskDetail.tsx';
import { EmployeeAttendancePage } from './pages/employee/EmployeeAttendancePage.tsx';
import EmployeeDailyWorkPage from './pages/employee/DailyWork.tsx';
import EmployeeWorkHistoryPage from './pages/employee/WorkHistory.tsx';
import EmployeeLeavesPage from './pages/employee/Leaves.tsx';
import EmployeeLoginHistoryPage from './pages/employee/LoginHistory.tsx';
import EmployeeProfilePage from './pages/employee/Profile.tsx';

// Shared
import NotificationsPage from './pages/shared/NotificationsPage.tsx';

function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'HR') return <Navigate to="/hr/dashboard" replace />;
  return <Navigate to="/employee/dashboard" replace />;
}

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-2">403</h1>
        <p className="text-lg font-medium text-slate-800 mb-1">Access Denied</p>
        <p className="text-sm text-slate-500 mb-6">You don't have permission to view this page.</p>
        <a href="/" className="btn-primary">Go to Home</a>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-400 mb-2">404</h1>
        <p className="text-lg font-medium text-slate-800 mb-1">Page Not Found</p>
        <p className="text-sm text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-primary">Go to Home</a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/employees" element={<AdminEmployeesPage />} />
            <Route path="/admin/employees/create" element={<HrCreateEmployeePage />} />
            <Route path="/admin/employees/:id" element={<AdminEmployeeDetailPage />} />
            <Route path="/admin/tasks" element={<AdminTasksPage />} />
            <Route path="/admin/attendance" element={<AdminAttendancePage />} />
            <Route path="/admin/leaves" element={<HrLeavesPage />} />
            <Route path="/admin/login-activity" element={<AdminLoginActivityPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/admin/profile" element={<EmployeeProfilePage />} />
          </Route>
        </Route>

        {/* HR routes */}
        <Route element={<HRRoute />}>
          <Route element={<HRLayout />}>
            <Route path="/hr/dashboard" element={<HrDashboardPage />} />
            <Route path="/hr/employees" element={<HrEmployeesPage />} />
            <Route path="/hr/employees/create" element={<HrCreateEmployeePage />} />
            <Route path="/hr/employees/:id" element={<AdminEmployeeDetailPage />} />
            <Route path="/hr/attendance" element={<HrAttendancePage />} />
            <Route path="/hr/login-activity" element={<AdminLoginActivityPage />} />
            <Route path="/hr/leaves" element={<HrLeavesPage />} />
            <Route path="/hr/reports" element={<AdminReportsPage />} />
            <Route path="/hr/notifications" element={<NotificationsPage />} />
            <Route path="/hr/profile" element={<EmployeeProfilePage />} />
          </Route>
        </Route>

        {/* Employee routes */}
        <Route element={<EmployeeRoute />}>
          <Route element={<EmployeeLayout />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/employee/office-attendance" element={<EmployeeAttendancePage />} />
            <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
            <Route path="/employee/tasks" element={<EmployeeTasksPage />} />
            <Route path="/employee/tasks/:id" element={<EmployeeTaskDetailPage />} />
            <Route path="/employee/daily-work" element={<EmployeeDailyWorkPage />} />
            <Route path="/employee/work-history" element={<EmployeeWorkHistoryPage />} />
            <Route path="/employee/leaves" element={<EmployeeLeavesPage />} />
            <Route path="/employee/login-history" element={<EmployeeLoginHistoryPage />} />
            <Route path="/employee/notifications" element={<NotificationsPage />} />
            <Route path="/employee/profile" element={<EmployeeProfilePage />} />
          </Route>
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ToastContainer />
    </AuthProvider>
  );
}
