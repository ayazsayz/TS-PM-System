import { create } from 'zustand';
import {
  attendanceService,
  captureLocation,
  type AttendanceDay,
  type LocationPayload,
} from '@/services/attendanceService';

interface AttendanceState {
  today: AttendanceDay | null;
  loading: boolean;
  busy: boolean;
  /** Set when the last check-in/out couldn't capture a position. */
  lastLocationStatus: LocationPayload['status'] | null;

  refresh: () => Promise<void>;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  reset: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  today: null,
  loading: true,
  busy: false,
  lastLocationStatus: null,

  refresh: async () => {
    try {
      set({ today: await attendanceService.today() });
    } catch {
      set({ today: null });
    } finally {
      set({ loading: false });
    }
  },

  checkIn: async () => {
    set({ busy: true });
    try {
      // Location is captured at this moment only — never continuously.
      const location = await captureLocation();
      set({ today: await attendanceService.checkIn(location), lastLocationStatus: location.status });
    } finally {
      set({ busy: false });
    }
  },

  checkOut: async () => {
    set({ busy: true });
    try {
      const location = await captureLocation();
      set({ today: await attendanceService.checkOut(location), lastLocationStatus: location.status });
    } finally {
      set({ busy: false });
    }
  },

  reset: () => set({ today: null, loading: true, busy: false, lastLocationStatus: null }),
}));
