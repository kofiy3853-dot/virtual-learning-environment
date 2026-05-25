'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/queries/useNotifications';
import { queryKeys } from '@/lib/queryKeys';
import {
  Bell, CheckCircle2, MessageSquare, Megaphone,
  Check, CheckCheck, Loader2, Video, GraduationCap,
  FileText, LucideIcon, Inbox
} from 'lucide-react';
import { communicationApi } from '@/utils/api/communicationApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type FilterType = 'all' | 'unread' | 'grade' | 'message' | 'announcement' | 'submission' | 'live_session';

interface Notification {
  _id: string;
  type: 'grade' | 'message' | 'announcement' | 'live_session' | 'submission';
  isRead: boolean;
  message: string;
  createdAt: string;
  referenceId?: string;
}

const typeConfig: Record<string, { label: string; icon: LucideIcon; bg: string; color: string; border: string }> = {
  grade: {
    label: 'Grade Update',
    icon: GraduationCap,
    bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100',
  },
  message: {
    label: 'New Message',
    icon: MessageSquare,
    bg: 'bg-indigo-50', color: 'text-indigo-600', border: 'border-indigo-100',
  },
  announcement: {
    label: 'Announcement',
    icon: Megaphone,
    bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100',
  },
  live_session: {
    label: 'Live Session',
    icon: Video,
    bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100',
  },
  submission: {
    label: 'Submission',
    icon: FileText,
    bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100',
  },
};

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',          label: 'All' },
  { id: 'unread',       label: 'Unread' },
  { id: 'grade',        label: 'Grades' },
  { id: 'announcement', label: 'Announcements' },
  { id: 'live_session', label: 'Live' },
  { id: 'message',      label: 'Messages' },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: notificationsData = [], isLoading: loading } = useNotifications(Boolean(user));
  const notifications = notificationsData as Notification[];
  const [filter, setFilter] = useState<FilterType>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map(n => communicationApi.markNotificationRead(n._id)));
      await queryClient.invalidateQueries({ queryKey: queryKeys.communication.notifications });
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update notifications');
    } finally {
      setMarkingAll(false);
    }
  };

  const markRead = async (id: string) => {
    const notif = notifications.find(n => n._id === id);
    if (!notif || notif.isRead) return;
    // Optimistic update
    queryClient.setQueryData(queryKeys.communication.notifications, (old: Notification[] = []) =>
      old.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    try {
      await communicationApi.markNotificationRead(id);
    } catch {
      // Revert on failure
      await queryClient.invalidateQueries({ queryKey: queryKeys.communication.notifications });
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell size={20} className="text-slate-400" /> Notifications
          </h1>
          <p className="page-subtitle mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You\'re all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="btn btn-secondary btn-sm gap-1.5 self-start sm:self-auto"
          >
            {markingAll ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
            Mark all as read
          </button>
        )}
      </header>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {f.label}
            {f.id === 'unread' && unreadCount > 0 && (
              <span className={`w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${
                filter === f.id ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
          <Inbox size={20} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">
            {filter === 'unread' ? 'All caught up!' : 'No notifications'}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {filter === 'unread' ? 'No unread notifications.' : 'Nothing here yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((n, idx) => {
              const cfg = typeConfig[n.type] ?? typeConfig.announcement;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={n._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => markRead(n._id)}
                  className={`group relative flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                    !n.isRead
                      ? 'bg-primary-50/50 border border-primary-200 hover:border-primary-300'
                      : 'bg-white border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Unread indicator */}
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-xl" />
                  )}

                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                        {cfg.label}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {format(new Date(n.createdAt), 'MMM d · h:mm a')}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 leading-relaxed ${!n.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                      {n.message}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center self-center pl-2">
                    {!n.isRead
                      ? <div className="w-2 h-2 rounded-full bg-primary-500" />
                      : <Check size={14} className="text-slate-300" />
                    }
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
