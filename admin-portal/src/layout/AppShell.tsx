import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import './AppShell.css';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path
          d="M2.5 10.83 10 3.33l7.5 7.5M4.17 9.17V16.7h4.16v-4.17h3.34v4.17h4.16V9.17"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/organizations',
    label: 'Organizations',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <rect x="2.5" y="3.33" width="6.67" height="6.67" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10.83" y="3.33" width="6.67" height="6.67" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="2.5" y="10.83" width="6.67" height="6.67" rx="1" stroke="currentColor" strokeWidth="1.6" />
        <rect x="10.83" y="10.83" width="6.67" height="6.67" rx="1" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    to: '/plans',
    label: 'Plans',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path
          d="M3.33 6.67 10 2.5l6.67 4.17v6.66L10 17.5l-6.67-4.17V6.67Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M10 10v7.5M3.33 6.67 10 10l6.67-3.33" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/subscriptions',
    label: 'Subscriptions',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <rect x="2.5" y="4.17" width="15" height="11.67" rx="1.67" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2.5 8.33h15" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5.83 11.67h3.34" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/users',
    label: 'Users',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path
          d="M13.33 17.5v-1.67a3.33 3.33 0 0 0-3.33-3.33H5.83a3.33 3.33 0 0 0-3.33 3.33V17.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7.92" cy="6.25" r="3.33" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M17.5 17.5v-1.67a3.33 3.33 0 0 0-2.5-3.23M13.33 2.6a3.33 3.33 0 0 1 0 6.46"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/audit',
    label: 'Audit log',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path
          d="M5 2.5h6.67L15.83 6.67V17.5a1.67 1.67 0 0 1-1.67 1.67H5A1.67 1.67 0 0 1 3.33 17.5V4.17A1.67 1.67 0 0 1 5 2.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M11.67 2.5V6.67h4.17" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M6.67 10.83h6.66M6.67 13.33h6.66M6.67 15.83h4.16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function AppShell() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">SA</span>
          <span className="brand__text">Super Admin</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-nav__item${isActive ? ' is-active' : ''}`}
            >
              <span className="sidebar-nav__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer__avatar">{user?.initials || 'SA'}</div>
          <div className="sidebar-footer__info">
            <div className="sidebar-footer__name">{user?.fullName || user?.email || 'Super Admin'}</div>
            <div className="sidebar-footer__email">{user?.email}</div>
          </div>
          <button type="button" className="sidebar-footer__logout" onClick={handleLogout} title="Sign out">
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
              <path
                d="M7.5 17.5H4.17a1.67 1.67 0 0 1-1.67-1.67V4.17c0-.92.75-1.67 1.67-1.67H7.5M13.33 14.17 17.5 10l-4.17-4.17M17.5 10H7.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </aside>
      <div className="shell__main">
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
