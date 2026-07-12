import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar, Icon } from '@/components';
import { brand } from '@/config/brand';
import { navSections } from '@/config/nav';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { selectPendingCount, useTimesheetStore } from '@/store/useTimesheetStore';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const navigate = useNavigate();
  const openPalette = useUiStore((s) => s.openPalette);
  const sidebarTone = useUiStore((s) => s.sidebarTone);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const pending = useTimesheetStore(selectPendingCount);

  const doLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`${styles.sidebar} ${sidebarTone === 'ink' ? 'sidebar-ink' : ''}`}>
      <div className={styles.brand}>
        <div className={styles.mark}>{brand.logoMark}</div>
        <div className={styles.brandName}>
          {brand.name} <span className={styles.brandSuffix}>{brand.suffix}</span>
        </div>
      </div>

      <button className={styles.search} onClick={openPalette}>
        <Icon name="search" size={13} />
        Search
        <span className={styles.kbd}>⌘K</span>
      </button>

      {navSections.map((section, si) => (
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
          <Avatar initials={user.initials} />
          <div className={styles.userMeta}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userRole}>{user.role}</div>
          </div>
          <div className={styles.logout} title="Sign out" onClick={doLogout}>
            <Icon name="logout" size={14} />
          </div>
        </div>
      </div>
    </aside>
  );
}
