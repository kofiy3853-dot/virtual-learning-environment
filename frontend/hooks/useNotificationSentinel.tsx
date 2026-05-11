'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { communicationApi } from '@/utils/api/communicationApi';
import toast from 'react-hot-toast';
import { Bell, MessageSquare, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function useNotificationSentinel() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Initial fetch of unread count
    communicationApi.getMyNotifications().then(res => {
      const unread = res.data.data.filter((n: { isRead: boolean }) => !n.isRead).length;
      setUnreadCount(unread);
    });
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_notification', (notif: { message?: string }) => {
      setUnreadCount(prev => prev + 1);
      
      // Premium SaaS Toast
      toast.custom((t) => (
        <div 
          className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-[24px] pointer-events-auto flex border border-slate-100 overflow-hidden group cursor-pointer`}
          onClick={() => {
            router.push('/notifications');
            toast.dismiss(t.id);
          }}
        >
          <div className="flex-1 w-0 p-5">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                    <Bell size={20} />
                 </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">New Academic Update</p>
                <p className="text-sm font-black text-slate-900 leading-tight mb-1">
                  {notif.message || 'You have a new notification'}
                </p>
                <p className="text-xs font-medium text-slate-400">
                  Click to view details in your portal.
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-slate-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 5000 });
    });

    socket.on('new_message', (msg: { senderName: string; body: string }) => {
       // Only toast if not on messages page
       if (window.location.pathname !== '/messages') {
          toast.custom((t) => (
            <div 
              className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 shadow-2xl rounded-[24px] pointer-events-auto flex border border-slate-800 overflow-hidden group cursor-pointer`}
              onClick={() => {
                router.push('/messages');
                toast.dismiss(t.id);
              }}
            >
              <div className="flex-1 w-0 p-5">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                     <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shadow-sm">
                        <MessageSquare size={20} />
                     </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Incoming Transmission</p>
                    <p className="text-sm font-black text-white leading-tight mb-1">
                      Message from {msg.senderName}
                    </p>
                    <p className="text-xs font-medium text-slate-400 truncate max-w-[200px]">
                      {msg.body}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-white/10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.dismiss(t.id);
                  }}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ), { duration: 6000 });
       }
    });

    return () => {
      socket.off('new_notification');
      socket.off('new_message');
    };
  }, [socket, router]);

  return { unreadCount };
}
