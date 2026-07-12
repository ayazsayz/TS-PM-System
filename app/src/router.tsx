import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layout/AppShell';
import { useAuthStore } from '@/store/useAuthStore';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import DailyEntryPage from '@/features/daily/DailyEntryPage';
import WeeklyTimesheetPage from '@/features/weekly/WeeklyTimesheetPage';
import ManagerDashboardPage from '@/features/manager/ManagerDashboardPage';
import ApprovalsPage from '@/features/approvals/ApprovalsPage';
import ProjectsPage from '@/features/projects/ProjectsPage';
import ReportsPage from '@/features/reports/ReportsPage';

/** Guards the app shell: unauthenticated users bounce to /login. */
function ProtectedShell() {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  if (!isAuthed) return <Navigate to="/login" replace />;
  return <AppShell />;
}

/** Redirects already-authed users away from /login. */
function LoginRoute() {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginRoute /> },
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
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
