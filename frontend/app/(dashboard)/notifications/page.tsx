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
  FileText, LucideIcon, Inbox, Trash2, X
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    if (!unreadCount) return;
    setMarkingAll(true);
    try {
      await communicationApi.markAllNotificationsRead();
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
    queryClient.setQueryData(queryKeys.communication.notifications, (old: Notification[] = []) =>
      old.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    try {
      await communicationApi.markNotificationRead(id);
    } catch {
      await queryClient.invalidateQueries({ queryKey: queryKeys.communication.notifications });
    }
  };

  const deleteOne = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    // Optimistic remove
    queryClient.setQueryData(queryKeys.communication.notifications, (old: Notification[] = []) =>
      old.filter(n => n._id !== id)
    );
    try {
      await communicationApi.deleteNotification(id);
    } catch {
      await queryClient.invalidateQueries({ queryKey: queryKeys.communication.notifications });
      toast.error('Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  const clearAll = async (onlyRead = false) => {
    setClearingAll(true);
    try {
      await communicationApi.deleteAllNotifications(onlyRead);
      await queryClient.invalidateQueries({ queryKey: queryKeys.communication.notifications });
      toast.success(onlyRead ? 'Read notifications cleared' : 'All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    } finally {
      setClearingAll(false);
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-widest">
              <Bell size={14} /> Notifications & Updates
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Your Notification Center
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''} waiting for your attention`
                : 'You\'re all caught up with your notifications'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="btn btn-secondary h-12 px-5 gap-2 text-xs font-bold shadow-sm transition-all rounded-xl"
              >
                {markingAll ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => clearAll(true)}
                disabled={clearingAll}
                className="h-12 px-5 gap-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center"
              >
                {clearingAll ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Clear read
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              filter === f.id
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {f.label}
            {f.id === 'unread' && unreadCount > 0 && (
              <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
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
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm relative group overflow-hidden"
        >
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
              <Inbox size={36} className="text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
              </h3>
              <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                {filter === 'unread' ? 'No unread notifications.' : 'Nothing here yet.'}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
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
                  className={`group relative flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all border ${
                    !n.isRead
                      ? 'bg-primary-50 border-primary-200 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/10'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/5'
                  }`}
                >
                  {/* Unread indicator */}
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500 rounded-l-2xl" />
                  )}

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-bold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                        {cfg.label}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {format(new Date(n.createdAt), 'MMM d · h:mm a')}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${!n.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                      {n.message}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center self-center pl-2 gap-1">
                    {!n.isRead
                      ? <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                      : <Check size={16} className="text-slate-300" />
                    }
                    <button
                      onClick={(e) => deleteOne(e, n._id)}
                      disabled={deletingId === n._id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-slate-300"
                      title="Delete notification"
                    >
                      {deletingId === n._id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                    </button>
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
