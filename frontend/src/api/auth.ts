import { apiFetch, setAccessToken, setRefreshToken } from './client';
import type { User } from '@/types/quiz';

interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export async function loginApi(email: string, password: string): Promise<User> {
  const res = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const data = res.data!;
  setAccessToken(data.access_token);
  setRefreshToken(data.refresh_token);
  return normalizeUser(data.user);
}

export async function registerApi(email: string, password: string, displayName: string): Promise<User> {
  const res = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName }),
  });

  const data = res.data!;
  setAccessToken(data.access_token);
  setRefreshToken(data.refresh_token);
  return normalizeUser(data.user);
}

export async function fetchMe(): Promise<User> {
  const res = await apiFetch<User>('/auth/me');
  return normalizeUser(res.data!);
}

export async function logoutApi(refreshToken: string): Promise<void> {
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Ignore errors on logout
  }
  setAccessToken(null);
  setRefreshToken(null);
}

function normalizeUser(u: Record<string, unknown>): User {
  return {
    id: u.id as string,
    email: u.email as string,
    displayName: (u.display_name ?? u.displayName ?? '') as string,
    avatarUrl: (u.avatar_url ?? u.avatarUrl ?? undefined) as string | undefined,
    createdAt: (u.created_at ?? u.createdAt ?? '') as string,
  };
}
