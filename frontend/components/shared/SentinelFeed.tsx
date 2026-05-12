'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, Zap, CheckCircle2, 
  MessageSquare, BookOpen, GraduationCap,
  Clock, ChevronRight, Activity
} from 'lucide-react';
import useNotificationSentinel from '@/hooks/useNotificationSentinel';
import { communicationApi } from '@/utils/api/communicationApi';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function SentinelFeed({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, unreadCount, refresh } = useNotificationSentinel();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const markAsRead = async (id: string) => {
    setLoading(id);
    try {
      await communicationApi.markNotificationRead(id);
      refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <Bell className="text-blue-500" size={16} />;
      case 'assignment': return <BookOpen className="text-amber-500" size={16} />;
      case 'grade': return <CheckCircle2 className="text-emerald-500" size={16} />;
      default: return <Activity className="text-slate-400" size={16} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[40]"
          />

          {/* Sentinel Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-100 dark:border-slate-800 z-[50] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Zap size={20} className="text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">The Sentinel</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Activity Engine</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-premium p-4 space-y-4">
              {unreadCount > 0 && (
                <div className="px-4 py-2 bg-primary-50 dark:bg-primary-500/10 rounded-xl flex items-center justify-between border border-primary-100 dark:border-primary-500/20">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                    {unreadCount} Unread Activities
                  </span>
                  <button 
                    onClick={() => notifications.forEach(n => !n.isRead && markAsRead(n._id))}
                    className="text-[10px] font-black text-primary-600 dark:text-primary-400 hover:underline uppercase tracking-widest"
                  >
                    Mark all as read
                  </button>
                </div>
              )}

              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div 
                      key={notif._id}
                      className={`group relative p-4 rounded-2xl transition-all border ${
                        notif.isRead 
                          ? 'bg-transparent border-transparent opacity-60' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          notif.isRead ? 'bg-slate-50 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800'
                        }`}>
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold leading-snug ${notif.isRead ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Clock size={10} />
                              {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </span>
                            {!notif.isRead && (
                              <button 
                                onClick={() => markAsRead(notif._id)}
                                disabled={loading === notif._id}
                                className="text-[10px] font-black text-primary-500 hover:text-primary-600 uppercase tracking-widest transition-colors"
                              >
                                {loading === notif._id ? '...' : 'Mark as read'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {!notif.isRead && (
                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-700">
                    <Bell size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">Awaiting Transmissions</p>
                    <p className="text-xs text-slate-400 mt-1">The Sentinel is currently silent.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
               <button 
                onClick={() => { router.push('/notifications'); onClose(); }}
                className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/20 dark:shadow-white/10 flex items-center justify-center gap-2"
               >
                 View All Notifications <ChevronRight size={14} />
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
