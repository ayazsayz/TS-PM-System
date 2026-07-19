import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Icon, PageContainer, type Tone } from '@/components';
import { ApiError } from '@/lib/apiClient';
import {
  attendanceService,
  formatMinutes,
  localDate,
  placeLabel,
  type AttendanceEvent,
  type AttendanceSession,
  type Place,
} from '@/services/attendanceService';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { useUiStore } from '@/store/useUiStore';
import styles from './Attendance.module.css';

const placeTone: Record<Place, Tone> = {
  InOffice: 'green',
  OffSite: 'amber',
  Unknown: 'neutral',
};

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

const day = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}

export default function AttendancePage() {
  const toast = useUiStore((s) => s.showToast);
  const { today, busy, refresh, checkIn, checkOut } = useAttendanceStore();

  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refresh();
      setHistory(await attendanceService.history(daysAgo(30), localDate()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<void>, verb: string) => {
    try {
      await fn();
      toast(verb);
      setHistory(await attendanceService.history(daysAgo(30), localDate()));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  const checkedIn = today?.isCheckedIn ?? false;

  // Group history into days (today's card shows separately).
  const byDay = history
    .filter((s) => s.localDate !== localDate())
    .reduce<Record<string, AttendanceSession[]>>((acc, s) => {
      (acc[s.localDate] ??= []).push(s);
      return acc;
    }, {});

  return (
    <PageContainer>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Attendance</h1>
          <div className={styles.subtitle}>
            Check in and out through the day — your location is recorded at that moment only.
          </div>
        </div>
        <Button
          variant={checkedIn ? 'secondary' : 'primary'}
          disabled={busy}
          onClick={() =>
            act(checkedIn ? checkOut : checkIn, checkedIn ? 'Checked out' : 'Checked in')
          }
        >
          <Icon name="clock" size={13} />
          {busy ? 'Locating…' : checkedIn ? 'Check out' : 'Check in'}
        </Button>
      </div>

      {today?.hasMissingCheckOut && (
        <Card pad={false} style={{ padding: '12px 16px', marginBottom: 14, borderColor: 'var(--amber)' }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center', fontSize: 13, color: 'var(--amber)' }}>
            <Icon name="alert" size={14} />
            An earlier day was left open — check out to close it.
          </div>
        </Card>
      )}

      {/* TODAY */}
      <Card style={{ marginBottom: 14 }}>
        <div className={styles.todayHead}>
          <div>
            <div className={styles.cardTitle}>Today</div>
            <div className={styles.subtitle}>{day(localDate())}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className={`${styles.total} tnum`}>{formatMinutes(today?.totalMinutes ?? 0)}</div>
            <div className={styles.subtitle}>present</div>
          </div>
        </div>

        {loading && <div className={styles.empty}>Loading…</div>}
        {!loading && error && (
          <div className={styles.empty} style={{ color: 'var(--red)' }}>
            {error}
          </div>
        )}
        {!loading && !error && (today?.sessions.length ?? 0) === 0 && (
          <div className={styles.empty}>Not checked in yet today.</div>
        )}

        {today?.sessions.map((s) => (
          <SessionRow key={s.id} session={s} />
        ))}
      </Card>

      {/* HISTORY */}
      <Card>
        <div className={styles.cardTitle} style={{ marginBottom: 12 }}>
          Last 30 days
        </div>
        {Object.keys(byDay).length === 0 && <div className={styles.empty}>No earlier attendance.</div>}
        {Object.entries(byDay).map(([d, sessions]) => {
          const total = sessions.reduce((t, s) => t + s.minutes, 0);
          return (
            <div key={d} className={styles.dayGroup}>
              <div className={styles.dayHead}>
                <span className={styles.dayLabel}>{day(d)}</span>
                <span className={`${styles.dayTotal} tnum`}>{formatMinutes(total)}</span>
              </div>
              {sessions.map((s) => (
                <SessionRow key={s.id} session={s} compact />
              ))}
            </div>
          );
        })}
      </Card>
    </PageContainer>
  );
}

function SessionRow({ session, compact }: { session: AttendanceSession; compact?: boolean }) {
  return (
    <div className={`${styles.session} ${compact ? styles.sessionCompact : ''}`}>
      <div className={styles.times}>
        <span className="tnum">{time(session.checkIn.at)}</span>
        <span className={styles.arrow}>→</span>
        <span className="tnum">
          {session.checkOut ? time(session.checkOut.at) : <em className={styles.openNow}>now</em>}
        </span>
      </div>
      <span className={`${styles.duration} tnum`}>{formatMinutes(session.minutes)}</span>
      <EventChip event={session.checkIn} />
      {session.isOpen && <Badge tone="green">Open</Badge>}
    </div>
  );
}

function EventChip({ event }: { event: AttendanceEvent }) {
  const label = event.officeName ?? placeLabel[event.place];
  const accuracy =
    event.accuracyMeters != null ? ` · ±${Math.round(event.accuracyMeters)}m` : '';

  const maps =
    event.latitude != null && event.longitude != null
      ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}`
      : null;

  return (
    <span className={styles.chipWrap}>
      <Badge tone={placeTone[event.place]}>
        {label}
        {accuracy}
      </Badge>
      {maps && (
        <a href={maps} target="_blank" rel="noreferrer" className={styles.mapLink} title="Open in maps">
          map ↗
        </a>
      )}
    </span>
  );
}
