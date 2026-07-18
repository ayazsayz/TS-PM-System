import type { CSSProperties } from 'react';

export const ssoBtn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  padding: 11,
  borderRadius: 9,
  border: '1px solid var(--border2)',
  background: 'var(--surface)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  color: 'var(--text)',
};

export const primaryBtn: CSSProperties = {
  width: '100%',
  padding: 11,
  borderRadius: 9,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
};

export const fieldLabel: CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--text2)',
  marginBottom: 6,
};

export const field: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 9,
  border: '1px solid var(--border2)',
  background: 'var(--surface)',
  fontSize: 14,
};

export const errorBanner: CSSProperties = {
  background: 'var(--red-soft)',
  color: 'var(--red)',
  border: '1px solid var(--red)',
  borderRadius: 9,
  padding: '10px 12px',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 14,
};
