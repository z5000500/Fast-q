import { useEffect, useState, useRef } from 'react';
import { getSocket, disconnectSocket } from './client';
import type { Notification } from '@/types/quiz';

export function useLiveNotifications(enabled: boolean) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket('/notifications', true);
    socketRef.current = socket;

    socket.on('server:unread-count', ({ count }) => {
      setUnreadCount(count);
    });

    socket.on('server:notification', (notification: Notification) => {
      setLatestNotification(notification);
      setUnreadCount(c => c + 1);
    });

    return () => {
      socket.removeAllListeners();
      disconnectSocket('/notifications');
    };
  }, [enabled]);

  const decrementUnread = () => setUnreadCount(c => Math.max(0, c - 1));

  return { unreadCount, latestNotification, decrementUnread };
}
