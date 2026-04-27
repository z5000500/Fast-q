import { apiFetch } from './client';
import type { Notification } from '@/types/quiz';

interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

export async function fetchNotifications(): Promise<NotificationListResponse> {
  const res = await apiFetch<NotificationListResponse>('/notifications');
  return res.data ?? { notifications: [], unreadCount: 0 };
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
}
