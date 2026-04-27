const API_BASE = '/api';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('quizcraft_refresh_token');
}

export function setRefreshToken(token: string | null) {
  if (token) {
    localStorage.setItem('quizcraft_refresh_token', token);
  } else {
    localStorage.removeItem('quizcraft_refresh_token');
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });

    if (!res.ok) {
      setRefreshToken(null);
      setAccessToken(null);
      return null;
    }

    const json = await res.json();
    const newAccess = json.data.access_token;
    const newRefresh = json.data.refresh_token;

    setAccessToken(newAccess);
    setRefreshToken(newRefresh);
    return newAccess;
  } catch {
    setRefreshToken(null);
    setAccessToken(null);
    return null;
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string>;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // If 401, try refresh once
  if (res.status === 401 && getRefreshToken()) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    }
  }

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(json.message || 'Request failed', res.status, json.errors);
  }

  return json as ApiResponse<T>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
