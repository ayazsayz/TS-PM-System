import { create } from 'zustand';
import { brand } from '@/config/brand';

export type Theme = 'light' | 'dark';
export type SidebarTone = 'quiet' | 'ink';
export type Density = 'comfortable' | 'compact';

interface UiState {
  theme: Theme;
  accent: string;
  sidebarTone: SidebarTone;
  density: Density;

  paletteOpen: boolean;
  notifOpen: boolean;
  tweaksOpen: boolean;
  unread: number;
  toast: string | null;

  // actions
  initAppearance: () => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setAccent: (hex: string) => void;
  setSidebarTone: (t: SidebarTone) => void;
  setDensity: (d: Density) => void;

  togglePalette: () => void;
  openPalette: () => void;
  closePalette: () => void;
  toggleNotif: () => void;
  closeNotif: () => void;
  markAllRead: () => void;
  toggleTweaks: () => void;
  closeTweaks: () => void;
  closeOverlays: () => void;

  showToast: (msg: string) => void;
  clearToast: () => void;
}

/** Push theme + accent onto <html> so the CSS variables switch. */
function applyToDom(theme: Theme, accent: string) {
  const el = document.documentElement;
  el.setAttribute('data-theme', theme);
  el.style.setProperty('--accent', accent);
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>((set, get) => ({
  theme: 'light',
  accent: brand.defaultAccent,
  sidebarTone: 'quiet',
  density: 'comfortable',

  paletteOpen: false,
  notifOpen: false,
  tweaksOpen: false,
  unread: 4,
  toast: null,

  initAppearance: () => {
    const { theme, accent } = get();
    applyToDom(theme, accent);
  },
  setTheme: (theme) => {
    applyToDom(theme, get().accent);
    set({ theme });
  },
  toggleTheme: () => {
    const theme = get().theme === 'light' ? 'dark' : 'light';
    applyToDom(theme, get().accent);
    set({ theme });
  },
  setAccent: (accent) => {
    applyToDom(get().theme, accent);
    set({ accent });
  },
  setSidebarTone: (sidebarTone) => set({ sidebarTone }),
  setDensity: (density) => set({ density }),

  togglePalette: () =>
    set((s) => ({ paletteOpen: !s.paletteOpen, notifOpen: false, tweaksOpen: false })),
  openPalette: () => set({ paletteOpen: true, notifOpen: false, tweaksOpen: false }),
  closePalette: () => set({ paletteOpen: false }),
  toggleNotif: () =>
    set((s) => ({ notifOpen: !s.notifOpen, paletteOpen: false, tweaksOpen: false })),
  closeNotif: () => set({ notifOpen: false }),
  markAllRead: () => set({ unread: 0 }),
  toggleTweaks: () =>
    set((s) => ({ tweaksOpen: !s.tweaksOpen, paletteOpen: false, notifOpen: false })),
  closeTweaks: () => set({ tweaksOpen: false }),
  closeOverlays: () => set({ paletteOpen: false, notifOpen: false, tweaksOpen: false }),

  showToast: (toast) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast });
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
  clearToast: () => set({ toast: null }),
}));
