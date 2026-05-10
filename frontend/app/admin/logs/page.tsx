'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/utils/api/adminApi';
import { AxiosError } from 'axios';
import Sidebar from '@/components/shared/Sidebar';
import { 
  ShieldAlert, KeyRound, Terminal, UserCog, AlertTriangle, 
  CheckCircle2, Search, Filter, RefreshCw, ClipboardList, Activity
} from 'lucide-react';

type LogType = 'all' | 'security' | 'auth' | 'system' | 'user';

const actionToType: Record<string, LogType> = {
  DELETE_USER: 'security',
  SUSPEND_USER: 'security',
  IMPERSONATE_START: 'auth',
  IMPERSONATE_EXIT: 'auth',
  CHANGE_ROLE: 'user',
  DELETE_COURSE: 'system',
  REASSIGN_TEACHER: 'system',
  ARCHIVE_COURSE: 'system',
  ACTIVATE_USER: 'user',
};

interface LogEntry {
  _id: string;
  action: string;
  adminId?: { email?: string; name?: string; };
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

interface DisplayLog {
  _id: string;
  type: LogType;
  user: string;
  action: string;
  meta: string;
  ip?: string;
  createdAt: string;
}

function logToDisplay(log: LogEntry): DisplayLog {
  return {
    _id: log._id,
    type: actionToType[log.action] || 'system',
    user: log.adminId?.email || log.adminId?.name || 'Unknown Admin',
    action: log.action.replace(/_/g, ' '),
    meta: log.metadata ? Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(', ') : '',
    ip: log.ip,
    createdAt: log.createdAt,
  };
}

export default function AdminLogsPage() {
  const { user }              = useAuth();
  const [logs, setLogs]       = useState<DisplayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<LogType>('all');
  const [toast, setToast]     = useState<{msg: string, type: string} | null>(null);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLogs = useCallback(() => {
    setLoading(true);
    adminApi.getLogs()
      .then(res => {
        const raw = (res.data.data || []) as LogEntry[];
        setLogs(raw.map(logToDisplay));
      })
      .catch((err: any) => {
        showToast(err.response?.data?.message || 'Failed to fetch audit logs', 'error');
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = logs.filter(l => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = l.action.toLowerCase().includes(q) || l.user.toLowerCase().includes(q);
    const matchesType = typeFilter === 'all' || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeStyle = (type: LogType) => {
    switch(type) {
      case 'security': return { icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Security' };
      case 'auth': return { icon: KeyRound, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Auth' };
      case 'system': return { icon: Terminal, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'System' };
      case 'user': return { icon: UserCog, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'User' };
      default: return { icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Activity' };
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-8 left-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl border flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Audit & Activity Logs</h1>
              <p className="text-slate-500 font-medium">Monitor administrative actions and security events across the entire system.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
              <ClipboardList size={24} />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-4 mb-6 flex flex-col md:flex-row items-center gap-4 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm"
                placeholder="Search by action or admin..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 pl-10 pr-10 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm cursor-pointer min-w-[150px]"
                  value={typeFilter} onChange={e => setTypeFilter(e.target.value as LogType)}
                >
                  <option value="all">All Types</option>
                  <option value="security">Security</option>
                  <option value="auth">Authentication</option>
                  <option value="system">System</option>
                  <option value="user">User Mgmt</option>
                </select>
              </div>

              <button onClick={fetchLogs} 
                className="h-12 px-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 group">
                <RefreshCw size={16} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> 
                Refresh
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[15%]">Type</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[25%]">Administrator</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[30%]">Action Details</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[15%]">IP Address</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[15%]">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Fetching secure logs...</p>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <ClipboardList size={24} className="text-slate-400" />
                        </div>
                        <p className="text-lg font-extrabold text-slate-900 mb-1">No logs found</p>
                        <p className="text-sm font-medium text-slate-500">Try adjusting your search or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, idx) => {
                      const style = getTypeStyle(log.type);
                      const Icon = style.icon;

                      return (
                        <motion.tr key={log._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.05, 0.5) }} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${style.bg} ${style.color} ${style.border}`}>
                              <Icon size={12} /> {style.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${style.bg} ${style.color}`}>
                                {log.user.charAt(0).toUpperCase()}
                              </div>
                              <p className="font-bold text-slate-900 truncate">{log.user}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-extrabold text-slate-700 uppercase tracking-wide text-xs mb-1">
                              {log.action}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 font-mono truncate">
                              {log.meta || '—'}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-block px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[10px] font-bold">
                              {log.ip || 'Local'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-700">{new Date(log.createdAt).toLocaleDateString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleTimeString()}</p>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Showing {filteredLogs.length} events</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
