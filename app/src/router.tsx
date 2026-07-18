import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { useAuthStore } from '@/store/useAuthStore';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import ChangePasswordPage from '@/features/auth/ChangePasswordPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import DailyEntryPage from '@/features/daily/DailyEntryPage';
import WeeklyTimesheetPage from '@/features/weekly/WeeklyTimesheetPage';
import ManagerDashboardPage from '@/features/manager/ManagerDashboardPage';
import ApprovalsPage from '@/features/approvals/ApprovalsPage';
import ProjectsPage from '@/features/projects/ProjectsPage';
import ReportsPage from '@/features/reports/ReportsPage';
import UsersPage from '@/features/admin/UsersPage';

/** Full-page spinner while the session is being restored from a stored token. */
function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text3)',
        fontSize: 14,
        background: 'var(--bg)',
      }}
    >
      Loading…
    </div>
  );
}

/**
 * Guards the app shell. A user still on a one-time password is pinned to
 * /change-password and cannot reach any other route.
 */
function ProtectedShell() {
  const { isAuthed, mustChangePassword, loading } = useAuthStore();
  if (loading) return <Loading />;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  return <AppShell />;
}

/** Admin-only routes. Non-admins are bounced to the dashboard. */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole('Admin')) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function LoginRoute() {
  const { isAuthed, mustChangePassword, loading } = useAuthStore();
  if (loading) return <Loading />;
  if (isAuthed && mustChangePassword) return <Navigate to="/change-password" replace />;
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

/** Public signup. Authenticated users are sent to the app. */
function RegisterRoute() {
  const { isAuthed, loading } = useAuthStore();
  if (loading) return <Loading />;
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  return <RegisterPage />;
}

/** Reachable while restricted (forced change) and when voluntarily changing. */
function ChangePasswordRoute() {
  const { isAuthed, loading } = useAuthStore();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location }} />;
  return <ChangePasswordPage />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginRoute /> },
  { path: '/register', element: <RegisterRoute /> },
  { path: '/change-password', element: <ChangePasswordRoute /> },
  {
    path: '/',
    element: <ProtectedShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'daily', element: <DailyEntryPage /> },
      { path: 'weekly', element: <WeeklyTimesheetPage /> },
      { path: 'team', element: <ManagerDashboardPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      {
        path: 'admin/users',
        element: (
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
