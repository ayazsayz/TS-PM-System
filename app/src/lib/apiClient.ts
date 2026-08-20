/**
 * Thin fetch wrapper for the Tspm API.
 *
 * - Attaches the bearer token.
 * - On 401, transparently refreshes once and retries the original request.
 * - Surfaces RFC-9457 ProblemDetails / FluentValidation errors as ApiError.
 */

// Dev sets VITE_API_URL to the local API (see .env). In the production build the value is
// empty, so requests go to the same origin (/api/...) — the API serves the SPA and there is
// no cross-origin call, hence no CORS.
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const ACCESS_KEY = 'tspm.accessToken';
const REFRESH_KEY = 'tspm.refreshToken';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  /** Field-level errors from FluentValidation, if any. */
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  /** Flattened list of every message, useful for showing in a form. */
  get allMessages(): string[] {
    if (this.errors) return Object.values(this.errors).flat();
    return [this.message];
  }
}

interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
  message?: string;
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: ProblemDetails | undefined;
  try {
    body = await res.json();
  } catch {
    /* non-JSON body */
  }
  const message =
    body?.detail ||
    body?.message ||
    body?.title ||
    (res.status === 401 ? 'Invalid email or password.' : `Request failed (${res.status})`);
  return new ApiError(res.status, message, body?.errors);
}

/** Refresh the access token. Returns true on success. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) return false;

  const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    tokenStore.clear();
    return false;
  }
  const data = await res.json();
  tokenStore.set(data.accessToken, data.refreshToken);
  return true;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Skip the bearer token (used by login/refresh). */
  anonymous?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { method = 'GET', body, anonymous } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!anonymous && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // Access token expired — refresh once, then retry.
  if (res.status === 401 && !anonymous && !isRetry && (await tryRefresh())) {
    return request<T>(path, options, true);
  }

  if (!res.ok) throw await toApiError(res);

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, anonymous = false) =>
    request<T>(path, { method: 'POST', body, anonymous }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
