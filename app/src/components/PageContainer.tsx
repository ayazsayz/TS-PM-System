import type { ReactNode } from 'react';

/** Standard screen wrapper: max-width, centered, page padding + entrance anim. */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div
      className="animate-fade-up"
      style={{ padding: '26px 28px 40px', maxWidth: 1240, margin: '0 auto' }}
    >
      {children}
    </div>
  );
}
