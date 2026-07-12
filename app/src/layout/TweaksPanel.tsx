import { Icon } from '@/components';
import { useUiStore, type Density, type SidebarTone } from '@/store/useUiStore';

const accents: [string, string][] = [
  ['#4757E6', 'Indigo'],
  ['#0E9384', 'Teal'],
  ['#B4441F', 'Rust'],
  ['#7839EE', 'Violet'],
];

const tones: [SidebarTone, string][] = [
  ['quiet', 'Quiet'],
  ['ink', 'Ink'],
];

const densities: [Density, string][] = [
  ['comfortable', 'Comfortable'],
  ['compact', 'Compact'],
];

const heading = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--text3)',
  marginBottom: 9,
} as const;

export function TweaksPanel() {
  const { accent, setAccent, sidebarTone, setSidebarTone, density, setDensity, closeTweaks } =
    useUiStore();

  const segment = <T extends string>(
    opts: [T, string][],
    current: T,
    onPick: (v: T) => void,
  ) => (
    <div
      style={{
        display: 'flex',
        border: '1px solid var(--border2)',
        borderRadius: 9,
        padding: 3,
        gap: 3,
      }}
    >
      {opts.map(([key, label]) => {
        const active = current === key;
        return (
          <div
            key={key}
            onClick={() => onPick(key)}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12.5,
              fontWeight: 600,
              padding: '7px 0',
              borderRadius: 7,
              cursor: 'pointer',
              background: active ? 'var(--text)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--text2)',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 64,
        right: 24,
        width: 280,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-lg)',
        zIndex: 90,
        animation: 'popIn 0.18s ease both',
        padding: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 650 }}>Appearance</div>
        <div
          onClick={closeTweaks}
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text3)',
          }}
        >
          <Icon name="close" size={12} />
        </div>
      </div>

      <div style={heading}>ACCENT</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        {accents.map(([c, label]) => (
          <div
            key={c}
            title={label}
            onClick={() => setAccent(c)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 99,
              background: c,
              cursor: 'pointer',
              boxShadow:
                c.toLowerCase() === accent.toLowerCase()
                  ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}`
                  : 'none',
              transition: 'box-shadow 0.15s',
            }}
          />
        ))}
      </div>

      <div style={heading}>SIDEBAR TONE</div>
      <div style={{ marginBottom: 18 }}>{segment(tones, sidebarTone, setSidebarTone)}</div>

      <div style={heading}>DENSITY</div>
      {segment(densities, density, setDensity)}

      <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 14, lineHeight: 1.5 }}>
        Ink pairs the sidebar with the login hero. Compact fits ~15% more rows on screen.
      </div>
    </div>
  );
}
