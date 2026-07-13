import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components';
import { useUiStore } from '@/store/useUiStore';
import { useTimesheetStore } from '@/store/useTimesheetStore';
import { useAuthStore } from '@/store/useAuthStore';

interface PaletteAction {
  label: string;
  hint: string;
  glyph: string;
  run: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const closePalette = useUiStore((s) => s.closePalette);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const submitWeek = useTimesheetStore((s) => s.submitWeek);
  const logout = useAuthStore((s) => s.logout);

  const goto = (path: string) => {
    navigate(`/${path}`);
    closePalette();
  };

  const actions: PaletteAction[] = [
    { label: 'Go to Dashboard', hint: 'Page', glyph: '▦', run: () => goto('dashboard') },
    { label: 'Log time — Daily Entry', hint: 'Page', glyph: '◔', run: () => goto('daily') },
    { label: 'Weekly Timesheet', hint: 'Page', glyph: '▤', run: () => goto('weekly') },
    { label: 'Team Overview', hint: 'Page', glyph: '◫', run: () => goto('team') },
    { label: 'Approvals', hint: 'Page', glyph: '✓', run: () => goto('approvals') },
    { label: 'Projects', hint: 'Page', glyph: '▣', run: () => goto('projects') },
    { label: 'Reports', hint: 'Page', glyph: '▥', run: () => goto('reports') },
    {
      label: 'Toggle dark mode',
      hint: 'Action',
      glyph: '◐',
      run: () => {
        toggleTheme();
        closePalette();
      },
    },
    {
      label: 'Submit weekly timesheet',
      hint: 'Action',
      glyph: '↑',
      run: () => {
        submitWeek();
        navigate('/weekly');
        closePalette();
      },
    },
    {
      label: 'Sign out',
      hint: 'Action',
      glyph: '←',
      run: async () => {
        await logout();
        goto('login');
      },
    },
  ];

  const q = query.toLowerCase();
  const items = actions.filter((a) => !q || a.label.toLowerCase().includes(q));

  return (
    <div
      onClick={closePalette}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,13,20,.42)',
        backdropFilter: 'blur(2px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '14vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: '92vw',
          height: 'fit-content',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'popIn 0.16s ease both',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Icon name="search" size={15} style={{ color: 'var(--text3)' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions, pages, projects…"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14.5, outline: 'none' }}
          />
          <span
            style={{
              fontSize: 10.5,
              border: '1px solid var(--border)',
              borderRadius: 5,
              padding: '2px 6px',
              color: 'var(--text3)',
            }}
          >
            ESC
          </span>
        </div>

        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
          {items.map((it) => (
            <div
              key={it.label}
              onClick={it.run}
              className="palette-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 11px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13.5,
              }}
            >
              <span style={{ color: 'var(--text3)', display: 'flex' }}>{it.glyph}</span>
              <span style={{ fontWeight: 550 }}>{it.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{it.hint}</span>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{ padding: '18px 11px', fontSize: 13, color: 'var(--text3)' }}>
              No matches for “{query}”
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
