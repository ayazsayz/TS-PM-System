import { api } from '@/lib/apiClient';

export type LocationStatus = 'Provided' | 'Denied' | 'Unavailable';
export type Place = 'InOffice' | 'OffSite' | 'Unknown';

export interface LocationPayload {
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
  status: LocationStatus;
}

export interface AttendanceEvent {
  at: string;
  place: Place;
  locationStatus: LocationStatus;
  officeName: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
}

export interface AttendanceSession {
  id: string;
  localDate: string;
  checkIn: AttendanceEvent;
  checkOut: AttendanceEvent | null;
  isOpen: boolean;
  minutes: number;
}

export interface AttendanceDay {
  localDate: string;
  sessions: AttendanceSession[];
  totalMinutes: number;
  isCheckedIn: boolean;
  hasMissingCheckOut: boolean;
}

export interface TeamPresence {
  userId: string;
  name: string;
  initials: string;
  avatarColor: string;
  status: 'Checked in' | 'Checked out' | 'Not checked in';
  place: Place | null;
  officeName: string | null;
  sinceUtc: string | null;
  totalMinutes: number;
}

export interface Office {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

export interface UpsertOfficePayload {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

/**
 * Ask the browser for a position. Never rejects — a refusal or failure resolves
 * to a payload whose status explains why, so check-in is never blocked by it.
 *
 * Note: the Geolocation API requires HTTPS in production (localhost is exempt).
 */
export function captureLocation(timeoutMs = 10_000): Promise<LocationPayload> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ status: 'Unavailable' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          status: 'Provided',
        }),
      (err) => resolve({ status: err.code === err.PERMISSION_DENIED ? 'Denied' : 'Unavailable' }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
    );
  });
}

/** The user's local calendar day as `yyyy-MM-dd` (server stores UTC timestamps). */
export function localDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const attendanceService = {
  today: (date = localDate()) => api.get<AttendanceDay>(`/api/attendance/today?localDate=${date}`),
  checkIn: (location: LocationPayload, date = localDate()) =>
    api.post<AttendanceDay>('/api/attendance/check-in', { localDate: date, location }),
  checkOut: (location: LocationPayload) =>
    api.post<AttendanceDay>('/api/attendance/check-out', { location }),
  history: (from: string, to: string) =>
    api.get<AttendanceSession[]>(`/api/attendance/me?from=${from}&to=${to}`),
  team: (date = localDate()) => api.get<TeamPresence[]>(`/api/attendance/team?localDate=${date}`),
};

export const officesService = {
  list: () => api.get<Office[]>('/api/offices'),
  create: (payload: UpsertOfficePayload) => api.post<Office>('/api/offices', payload),
  update: (id: string, payload: UpsertOfficePayload) => api.put<Office>(`/api/offices/${id}`, payload),
  remove: (id: string) => api.del<void>(`/api/offices/${id}`),
};

/** "7h 43m" from minutes. */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const placeLabel: Record<Place, string> = {
  InOffice: 'In office',
  OffSite: 'Off-site',
  Unknown: 'No location',
};
