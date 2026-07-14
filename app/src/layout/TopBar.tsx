import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Icon } from '@/components';
import { titleByPath } from '@/config/nav';
import { useAuthStore } from '@/store/useAuthStore';
import { useUiStore } from '@/store/useUiStore';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { NotificationPanel } from './NotificationPanel';
import styles from './TopBar.module.css';

export function TopBar() {
  const location = useLocation();
  const path = location.pathname.replace(/^\//, '');
  const title = titleByPath[path] ?? '';

  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleTweaks = useUiStore((s) => s.toggleTweaks);
  const toggleNotif = useUiStore((s) => s.toggleNotif);
  const notifOpen = useUiStore((s) => s.notifOpen);
  const user = useAuthStore((s) => s.user);

  const unread = useWorkspaceStore((s) => s.unread);
  const refreshNotifications = useWorkspaceStore((s) => s.refreshNotifications);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  return (
    <header className={styles.topbar}>
      <div className={styles.title}>{title}</div>
      <div className={styles.actions}>
        <div className={styles.iconBtn} title="Toggle theme" onClick={toggleTheme}>
          <Icon name={theme === 'light' ? 'sun' : 'moon'} size={15} />
        </div>
        <div className={styles.iconBtn} title="Appearance tweaks" onClick={toggleTweaks}>
          <Icon name="sliders" size={15} />
        </div>
        <div className={styles.iconBtn} title="Notifications" onClick={toggleNotif}>
          <Icon name="bell" size={15} />
          {unread > 0 && <span className={styles.notifDot}>{unread}</span>}
        </div>
        <div className={styles.avatarBtn}>{user?.initials ?? '?'}</div>
      </div>

      {notifOpen && <NotificationPanel />}
    </header>
  );
}
