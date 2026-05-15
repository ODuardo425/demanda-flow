'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const WS_URL = API_URL.replace(/\/api\/v1\/?$/, '');

export type Notification = {
  id: string;
  userId: string;
  type: string;
  payload: any;
  readAt: string | null;
  createdAt: string;
};

export function useNotifications(token: string | null) {
  const [items, setItems] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('notification.created', (n: Notification) => {
      setItems((curr) => [n, ...curr]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const markRead = (id: string) => {
    setItems((curr) =>
      curr.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  };

  const unreadCount = items.filter((n) => !n.readAt).length;
  return { items, unreadCount, markRead, setItems };
}
