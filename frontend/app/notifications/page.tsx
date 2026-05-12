'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Bell, CheckCircle2, MessageSquare, Megaphone, 
  Check, CheckCheck, Filter, Loader2, Video, GraduationCap
} from 'lucide-react';
import { communicationApi } from '@/utils/api/communicationApi';
import toast from 'react-hot-toast';

type FilterType = 'all' | 'unread' | 'grade' | 'message' | 'announcement';

interface Notification {
  _id: string;
  type: 'grade' | 'message' | 'announcement' | 'live_session';
  isRead: boolean;
  message: string;
  createdAt: string;
  referenceId?: string;
}



const typeConfig: Record<string, { title: string; icon: any; bg: string; color: string; border: string }> = {
  grade: {
    title: 'Grade Update',
    icon: GraduationCap,
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
    border: 'border-emerald-100'
  },
  message: {
    title: 'New Message',
    icon: MessageSquare,
    bg: 'bg-indigo-50',
    color: 'text-indigo-600',
    border: 'border-indigo-100'
  },
  announcement: {
    title: 'Announcement',
    icon: Megaphone,
    bg: 'bg-amber-50',
    color: 'text-amber-600',
    border: 'border-amber-100'
  },
  live_session: {
    title: 'Live Session Now',
    icon: Video,
    bg: 'bg-rose-50',
    color: 'text-rose-600',
    border: 'border-rose-100'
  }
};

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',           label: 'All' },
  { id: 'unread',        label: 'Unread' },
  { id: 'grade',         label: 'Grades' },
  { id: 'message',       label: 'Messages' },
  { id: 'announcement',  label: 'Announcements' },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    communicationApi.getMyNotifications()
      .then(res => setNotifications(res.data.data || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    
    try {
      await Promise.all(unread.map(n => communicationApi.markNotificationRead(n._id)));
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const markRead = async (id: string) => {
    const notif = notifications.find(n => n._id === id);
    if (!notif || notif.isRead) return;

    try {
      await communicationApi.markNotificationRead(id);
      setNotifications(p => p.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto p-8 lg:p-12 scroll-smooth">
        <div className="max-w-4xl mx-auto w-full pb-20">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Bell size={20} />
                </div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Intelligence Stream</h1>
              </div>
              <p className="text-slate-500 font-medium ml-13 pl-1">
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread update${unreadCount !== 1 ? 's' : ''}` 
                  : 'You are all caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm active:scale-95">
                <CheckCheck size={18} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <div className="flex items-center gap-2 mr-2 text-slate-400">
              <Filter size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Filter by:</span>
            </div>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  filter === f.id 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {f.label}
                {f.id === 'unread' && unreadCount > 0 && (
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold ${
                    filter === f.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white rounded-[24px] border border-slate-100 animate-pulse shadow-sm" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] border border-slate-200 p-16 text-center shadow-sm"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <Bell size={32} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">All clear!</h3>
              <p className="text-slate-500 font-medium">No updates in this category. You're fully caught up with the platform.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filtered.map((n, idx) => {
                  const cfg = typeConfig[n.type] || typeConfig.announcement;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={n._id}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                      onClick={() => markRead(n._id)}
                      className={`group relative flex gap-5 p-6 rounded-[24px] cursor-pointer transition-all duration-300 overflow-hidden ${
                        !n.isRead 
                          ? 'bg-blue-50/50 border border-blue-200 shadow-md shadow-blue-900/5 hover:border-blue-300' 
                          : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-[24px]" />
                      )}
                      
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform duration-500 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <Icon size={24} />
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <h4 className={`text-[15px] font-extrabold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                            {cfg.title}
                          </h4>
                          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase shrink-0">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`text-sm font-medium leading-relaxed ${!n.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                          {n.message}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center justify-center pl-4">
                        {!n.isRead ? (
                          <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm shadow-blue-600/50 ring-4 ring-blue-50" />
                        ) : (
                          <Check size={20} className="text-slate-300" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
