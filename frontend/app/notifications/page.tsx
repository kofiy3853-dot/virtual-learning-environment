'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Bell, CheckCircle2, MessageSquare, Megaphone, 
  Check, CheckAll, Filter
} from 'lucide-react';

type FilterType = 'all' | 'unread' | 'grades' | 'messages' | 'announcements';

const NOTIFICATIONS = [
  { id: 1, type: 'grades', read: false, title: 'Assignment graded', message: 'Your CS101 Assignment #3 has been graded. You scored 88/100.', time: '2 minutes ago' },
  { id: 2, type: 'messages', read: false, title: 'New message from Prof. Turing', message: 'Prof. Alan Turing sent you a message: "The assignment looks good!"', time: '15 minutes ago' },
  { id: 3, type: 'announcements', read: false, title: 'Course announcement', message: 'MATH201: The mid-semester exam has been rescheduled to next Friday.', time: '1 hour ago' },
  { id: 4, type: 'grades', read: true, title: 'Quiz result available', message: 'Your Physics Quiz #2 result is now available. Check your grades.', time: '3 hours ago' },
  { id: 5, type: 'announcements', read: true, title: 'New course material uploaded', message: 'ENG105: Week 7 lecture slides have been uploaded to the Modules section.', time: 'Yesterday' },
  { id: 6, type: 'messages', read: true, title: 'New message from Alice Smith', message: 'Alice Smith sent you a message: "Can you help me with the setup?"', time: 'Yesterday' },
  { id: 7, type: 'grades', read: true, title: 'Final grade posted', message: 'Your final grade for Semester 1 CS103 has been posted by the instructor.', time: '2 days ago' },
];

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  grades:        { icon: CheckCircle2,  color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
  messages:      { icon: MessageSquare, color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-100' },
  announcements: { icon: Megaphone,     color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100' },
};

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',           label: 'All' },
  { id: 'unread',        label: 'Unread' },
  { id: 'grades',        label: 'Grades' },
  { id: 'messages',      label: 'Messages' },
  { id: 'announcements', label: 'Announcements' },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterType>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(p => p.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-y-auto p-8 lg:p-12 scroll-smooth">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Bell size={20} />
                </div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
              </div>
              <p className="text-slate-500 font-medium ml-13 pl-1">
                {unreadCount > 0 
                  ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` 
                  : 'You are all caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm">
                <CheckAll size={18} />
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
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] border border-slate-200 p-16 text-center shadow-sm"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <Bell size={32} className="text-slate-300" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">All clear!</h3>
              <p className="text-slate-500 font-medium">No notifications in this category. You're fully caught up.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filtered.map((n, idx) => {
                  const cfg = typeConfig[n.type] || typeConfig.announcements;
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }}
                      onClick={() => markRead(n.id)}
                      className={`group relative flex gap-5 p-6 rounded-[24px] cursor-pointer transition-all duration-300 overflow-hidden ${
                        !n.read 
                          ? 'bg-blue-50/50 border border-blue-200 shadow-md shadow-blue-900/5 hover:border-blue-300' 
                          : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      {!n.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 rounded-l-[24px]" />
                      )}
                      
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform duration-500 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <Icon size={24} />
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <h4 className={`text-[15px] font-extrabold truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {n.title}
                          </h4>
                          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase shrink-0">
                            {n.time}
                          </span>
                        </div>
                        <p className={`text-sm font-medium leading-relaxed ${!n.read ? 'text-slate-700' : 'text-slate-500'}`}>
                          {n.message}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center justify-center pl-4">
                        {!n.read ? (
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
