import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components';
import { ApiError } from '@/lib/apiClient';
import { formatMinutes } from '@/services/attendanceService';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { useUiStore } from '@/store/useUiStore';
import styles from './CheckInWidget.module.css';

/**
 * Top-bar attendance control. Shows the current state and lets the user check
 * in/out from anywhere in the app.
 */
export function CheckInWidget() {
  const navigate = useNavigate();
  const toast = useUiStore((s) => s.showToast);
  const { today, loading, busy, refresh, checkIn, checkOut } = useAttendanceStore();

  // Re-render each minute so the running timer stays current.
  const [, setTick] = useState(0);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  if (loading || !today) return null;

  const open = today.sessions.find((s) => s.isOpen);
  const checkedIn = Boolean(open);

  // Minutes so far = completed sessions + the live one.
  const elapsed = today.sessions.reduce((total, s) => {
    if (!s.isOpen) return total + s.minutes;
    return total + Math.round((Date.now() - new Date(s.checkIn.at).getTime()) / 60_000);
  }, 0);

  const act = async (fn: () => Promise<void>, verb: string) => {
    try {
      await fn();
      const status = useAttendanceStore.getState().lastLocationStatus;
      toast(
        status === 'Provided'
          ? `${verb} — location recorded`
          : `${verb} — location not available`,
      );
    } catch (err) {
      toast(err instanceof ApiError ? err.message : `Could not ${verb.toLowerCase()}.`);
    }
  };

  return (
    <div className={styles.wrap}>
      <button
        className={styles.status}
        onClick={() => navigate('/attendance')}
        title="View attendance"
      >
        <span className={`${styles.dot} ${checkedIn ? styles.dotOn : ''}`} />
        <span className={styles.text}>
          {checkedIn ? 'Checked in' : today.sessions.length > 0 ? 'Checked out' : 'Not checked in'}
        </span>
        {elapsed > 0 && <span className={`${styles.time} tnum`}>{formatMinutes(elapsed)}</span>}
      </button>

      <button
        className={`${styles.action} ${checkedIn ? styles.out : styles.in}`}
        disabled={busy}
        onClick={() => act(checkedIn ? checkOut : checkIn, checkedIn ? 'Checked out' : 'Checked in')}
      >
        <Icon name="clock" size={13} />
        {busy ? 'Locating…' : checkedIn ? 'Check out' : 'Check in'}
      </button>
    </div>
  );
}
