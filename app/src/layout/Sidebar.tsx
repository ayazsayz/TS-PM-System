import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar, Icon } from '@/components';
import { brand } from '@/config/brand';
import { navSections } from '@/config/nav';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const navigate = useNavigate();
  const openPalette = useUiStore((s) => s.openPalette);
  const sidebarTone = useUiStore((s) => s.sidebarTone);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hasRole = useAuthStore((s) => s.hasRole);
  const pending = useWorkspaceStore((s) => s.pendingApprovals);
  const refreshApprovals = useWorkspaceStore((s) => s.refreshApprovals);

  const isManager = hasRole('Manager') || hasRole('Admin');

  // Live pending-approvals count for the badge (managers only).
  useEffect(() => {
    if (isManager) void refreshApprovals();
  }, [isManager, refreshApprovals]);

  // Role-gated sections (e.g. ADMIN) are hidden for users without the role.
  const sections = navSections.filter((s) => !s.requiresRole || hasRole(s.requiresRole));

  const doLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`${styles.sidebar} ${sidebarTone === 'ink' ? 'sidebar-ink' : ''}`}>
      <div className={styles.brand}>
        <div className={styles.mark}>{brand.logoMark}</div>
        <div className={styles.brandName}>
          {brand.name}
          {brand.suffix && <span className={styles.brandSuffix}> {brand.suffix}</span>}
        </div>
      </div>

      {/* Current organization (tenant) */}
      {user?.organizationName && (
        <div className={styles.workspace} title={user.organizationName}>
          <div className={styles.workspaceMark}>{user.organizationName.charAt(0).toUpperCase()}</div>
          <div className={styles.workspaceName}>{user.organizationName}</div>
        </div>
      )}

      <button className={styles.search} onClick={openPalette}>
        <Icon name="search" size={13} />
        Search
        <span className={styles.kbd}>⌘K</span>
      </button>

      {sections.map((section, si) => (
        <div key={section.heading}>
          <div className={`${styles.heading} ${si > 0 ? styles.headingTight : ''}`}>
            {section.heading}
          </div>
          <nav className={styles.nav}>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={`/${item.path}`}
                className={({ isActive }) =>
                  `${styles.item} ${isActive ? styles.itemActive : ''}`
                }
              >
                <Icon name={item.icon} size={16} />
                {item.label}
                {item.badge && pending > 0 && <span className={styles.navBadge}>{pending}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}

      <div className={styles.footer}>
        <div className={styles.userRow}>
          <Avatar initials={user?.initials ?? '?'} />
          <div className={styles.userMeta}>
            <div className={styles.userName}>{user?.fullName ?? ''}</div>
            <div className={styles.userRole}>{user?.title ?? ''}</div>
          </div>
          <div className={styles.logout} title="Sign out" onClick={doLogout}>
            <Icon name="logout" size={14} />
          </div>
        </div>
      </div>
    </aside>
  );
}
