/**
 * Impersonation session handling for the tenant app.
 *
 * Flow:
 *   - The Admin Portal opens `${appUrl}/#imp_token=...&imp_exp=...&imp_actor=...`.
 *   - On startup we detect the hash, back up any existing tenant tokens, and
 *     install the impersonation access token (no refresh token — the session
 *     dies with the JWT).
 *   - A banner is shown at the top of the shell while the current access token
 *     carries the `imp` claim.
 *   - "End impersonation" clears everything and reloads to the login page.
 */

const IMP_ACCESS_KEY = 'tspm.accessToken';
const IMP_REFRESH_KEY = 'tspm.refreshToken';
const PRIOR_ACCESS_KEY = 'tspm.priorAccess';
const PRIOR_REFRESH_KEY = 'tspm.priorRefresh';
const IMP_META_KEY = 'tspm.impersonation';

export interface ImpersonationMeta {
  actor: string;
  expiresAt: string;
}

interface JwtClaims {
  imp?: string;
  imp_email?: string;
  email?: string;
  name?: string;
  exp?: number;
  [k: string]: unknown;
}

function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/** Consume `#imp_token=...` from the URL, if present. Runs synchronously at startup. */
export function consumeImpersonationHash(): void {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  if (!hash.includes('imp_token=')) return;

  const params = new URLSearchParams(hash);
  const impToken = params.get('imp_token');
  const impExp = params.get('imp_exp') ?? '';
  const impActor = params.get('imp_actor') ?? 'a user';
  if (!impToken) return;

  // Back up whatever tokens the tab currently has, so "End impersonation" can restore them.
  const priorAccess = localStorage.getItem(IMP_ACCESS_KEY);
  const priorRefresh = localStorage.getItem(IMP_REFRESH_KEY);
  const alreadyImpersonating = !!localStorage.getItem(IMP_META_KEY);
  if (!alreadyImpersonating) {
    if (priorAccess) localStorage.setItem(PRIOR_ACCESS_KEY, priorAccess);
    else localStorage.removeItem(PRIOR_ACCESS_KEY);
    if (priorRefresh) localStorage.setItem(PRIOR_REFRESH_KEY, priorRefresh);
    else localStorage.removeItem(PRIOR_REFRESH_KEY);
  }

  localStorage.setItem(IMP_ACCESS_KEY, impToken);
  localStorage.setItem(IMP_REFRESH_KEY, ''); // no refresh — impersonation dies with the JWT
  localStorage.setItem(IMP_META_KEY, JSON.stringify({ actor: impActor, expiresAt: impExp }));

  // Strip the hash so a refresh doesn't re-apply it.
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

/** True if the current access token is an impersonation token (has an `imp` claim). */
export function isImpersonating(): boolean {
  const token = localStorage.getItem(IMP_ACCESS_KEY);
  if (!token) return false;
  const claims = decodeJwt(token);
  return !!claims?.imp;
}

export function getImpersonationInfo(): { actor: string; expiresAt: string; impersonatorEmail: string } | null {
  const token = localStorage.getItem(IMP_ACCESS_KEY);
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims?.imp) return null;
  const metaRaw = localStorage.getItem(IMP_META_KEY);
  const meta: ImpersonationMeta = metaRaw ? JSON.parse(metaRaw) : { actor: 'a user', expiresAt: '' };
  return {
    actor: meta.actor,
    expiresAt: meta.expiresAt || (claims.exp ? new Date(claims.exp * 1000).toISOString() : ''),
    impersonatorEmail: (claims.imp_email as string) || 'SuperAdmin',
  };
}

/** Clear the impersonation session, restore any prior tenant tokens, and reload. */
export function endImpersonation(): void {
  localStorage.removeItem(IMP_META_KEY);

  const priorAccess = localStorage.getItem(PRIOR_ACCESS_KEY);
  const priorRefresh = localStorage.getItem(PRIOR_REFRESH_KEY);
  if (priorAccess || priorRefresh) {
    localStorage.setItem(IMP_ACCESS_KEY, priorAccess ?? '');
    localStorage.setItem(IMP_REFRESH_KEY, priorRefresh ?? '');
  } else {
    localStorage.removeItem(IMP_ACCESS_KEY);
    localStorage.removeItem(IMP_REFRESH_KEY);
  }
  localStorage.removeItem(PRIOR_ACCESS_KEY);
  localStorage.removeItem(PRIOR_REFRESH_KEY);

  // Full reload so every store re-hydrates from the restored tokens (or logout).
  window.location.href = '/';
}
