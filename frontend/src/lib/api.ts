const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000';

const ACCESS_TOKEN_KEY = 'lifeos_access_token';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  // Attempt to refresh once on 401
  if (res.status === 401 && path !== '/api/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options);
    }
  }

  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch { /* non-JSON body */ }

  if (!res.ok) {
    throw new ApiError(
      (data.error as string) ?? `Request failed with status ${res.status}`,
      res.status,
      data.code as string | undefined,
    );
  }

  // Unwrap the standard { success, data } envelope when present
  return ('data' in data ? data.data : data) as T;
}

/** Attempt a silent token refresh using the httpOnly refresh cookie. */
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const { data } = await res.json() as { data: { accessToken: string } };
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get:    <T>(path: string)                   => request<T>(path),
  post:   <T>(path: string, body?: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body ?? {}) }),
  put:    <T>(path: string, body?: unknown)   => request<T>(path, { method: 'PUT',    body: JSON.stringify(body ?? {}) }),
  patch:  <T>(path: string, body?: unknown)   => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string)                   => request<T>(path, { method: 'DELETE' }),
};

export const storeToken  = (token: string) => localStorage.setItem(ACCESS_TOKEN_KEY, token);
export const clearToken  = ()              => localStorage.removeItem(ACCESS_TOKEN_KEY);
export const getToken    = ()              => localStorage.getItem(ACCESS_TOKEN_KEY);
