import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { OrganizationsPage } from './features/organizations/OrganizationsPage';
import { OrganizationDetailPage } from './features/organizations/OrganizationDetailPage';
import { PlansPage } from './features/plans/PlansPage';
import { SubscriptionsPage } from './features/subscriptions/SubscriptionsPage';
import { UsersPage } from './features/users/UsersPage';
import { AuditLogPage } from './features/audit/AuditLogPage';
import { useAuthStore } from './store/useAuthStore';

function FullScreenLoader() {
  return (
    <div className="route-loader">
      <div className="route-loader__spinner" />
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const loading = useAuthStore((s) => s.loading);

  if (loading) return <FullScreenLoader />;
  if (isAuthed) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function ProtectedShell() {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  const loading = useAuthStore((s) => s.loading);
  const hasRole = useAuthStore((s) => s.hasRole);

  if (loading) return <FullScreenLoader />;
  if (!isAuthed || !hasRole('SuperAdmin')) return <Navigate to="/login" replace />;
  return <AppShell />;
}

export const router = createBrowserRouter([
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  {
    path: '/',
    element: <ProtectedShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'organizations', element: <OrganizationsPage /> },
      { path: 'organizations/:organizationId', element: <OrganizationDetailPage /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'audit', element: <AuditLogPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

