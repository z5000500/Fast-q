import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/api/client';

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || '';

const sockets: Record<string, Socket> = {};

export function getSocket(namespace: string, requireAuth = false): Socket {
  const key = namespace;

  if (sockets[key]?.connected) {
    return sockets[key];
  }

  const opts: Record<string, unknown> = {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  };

  const token = getAccessToken();
  if (requireAuth || token) {
    opts.auth = { token };
  }

  const socket = io(`${REALTIME_URL}${namespace}`, opts);
  sockets[key] = socket;

  return socket;
}

export function disconnectSocket(namespace: string): void {
  const key = namespace;
  if (sockets[key]) {
    sockets[key].disconnect();
    delete sockets[key];
  }
}

export function disconnectAll(): void {
  Object.keys(sockets).forEach(disconnectSocket);
}
