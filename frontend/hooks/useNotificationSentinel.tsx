'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { communicationApi } from '@/utils/api/communicationApi';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';
import { Bell, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  type?: string;
  createdAt: string;
  [key: string]: unknown;
}

export default function useNotificationSentinel() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await communicationApi.getMyNotifications();
      const notifs: Notification[] = res.data.data;
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length);
      return notifs;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!user) return;
    void fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Invalidate the notifications query so the page updates live
      queryClient.invalidateQueries({ queryKey: queryKeys.communication.notifications });

      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-xl pointer-events-auto flex items-start gap-3 border border-slate-200 p-4 cursor-pointer`}
          onClick={() => { router.push('/notifications'); toast.dismiss(t.id); }}
        >
          <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
            <Bell size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 leading-snug">
              {notif.message || 'New notification'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tap to view</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
            className="text-slate-300 hover:text-slate-500 transition-colors text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      ), { duration: 5000 });
    });

    socket.on('new_message', (msg: { senderName: string; body: string }) => {
      if (window.location.pathname === '/messages') return;

      toast.custom((t) => (
        <div
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-xl pointer-events-auto flex items-start gap-3 border border-slate-200 p-4 cursor-pointer`}
          onClick={() => { router.push('/messages'); toast.dismiss(t.id); }}
        >
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <MessageSquare size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 leading-snug">
              Message from {msg.senderName}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{msg.body}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
            className="text-slate-300 hover:text-slate-500 transition-colors text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      ), { duration: 6000 });
    });

    return () => {
      socket.off('notification');
      socket.off('new_message');
    };
  }, [socket, router, queryClient]);

  return { unreadCount, notifications, refresh: fetchNotifications };
}
