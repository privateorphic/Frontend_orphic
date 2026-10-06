import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export function HRRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== 'ADMIN' && user.role !== 'HR') return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

export function EmployeeRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  // All authenticated roles can access employee routes
  return <Outlet />;
}
