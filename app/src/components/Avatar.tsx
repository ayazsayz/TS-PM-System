interface AvatarProps {
  initials: string;
  /** Background color. When omitted, uses the accent-soft treatment. */
  bg?: string;
  size?: number;
  /** Ring/border (used for overlapping stacks). */
  bordered?: boolean;
}

/** Circular initials avatar. */
export function Avatar({ initials, bg, size = 32, bordered }: AvatarProps) {
  const soft = !bg;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: soft ? 'var(--accent-soft)' : bg,
        color: soft ? 'var(--accent-text)' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.37),
        fontWeight: 700,
        flexShrink: 0,
        border: bordered ? '2px solid var(--surface)' : undefined,
      }}
    >
      {initials}
    </div>
  );
}
