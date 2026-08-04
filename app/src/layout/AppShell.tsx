import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Toast } from '@/components';
import { useUiStore } from '@/store/useUiStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { TweaksPanel } from './TweaksPanel';
import { ImpersonationBanner } from './ImpersonationBanner';

export function AppShell() {
  const paletteOpen = useUiStore((s) => s.paletteOpen);
  const tweaksOpen = useUiStore((s) => s.tweaksOpen);
  const density = useUiStore((s) => s.density);
  const togglePalette = useUiStore((s) => s.togglePalette);
  const closeOverlays = useUiStore((s) => s.closeOverlays);

  // Global shortcuts: ⌘K / Ctrl+K toggles the palette, Esc closes overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        togglePalette();
      }
      if (e.key === 'Escape') closeOverlays();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePalette, closeOverlays]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '238px 1fr',
        height: '100vh',
        minWidth: 1180,
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      <Sidebar />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <ImpersonationBanner />
        <TopBar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
            zoom: density === 'compact' ? 0.86 : 1,
          }}
        >
          <Outlet />
        </main>
      </div>

      {paletteOpen && <CommandPalette />}
      {tweaksOpen && <TweaksPanel />}
      <Toast />
    </div>
  );
}
