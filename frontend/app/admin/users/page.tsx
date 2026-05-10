'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/utils/api/adminApi';
import { AxiosError } from 'axios';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Users, GraduationCap, School, Shield, Search, Filter, 
  Trash2, Ban, CheckCircle2, UserCheck, UserPlus, Eye, X, AlertTriangle
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface StatsData {
  totalUsers?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalAdmins?: number;
}

interface ConfirmState {
  type: 'delete' | 'suspend' | 'reactivate';
  user: User;
  userName: string;
}

const ROLES   = ['all','student','teacher','admin'];
const STATUSES = ['all','active','suspended'];

const roleBadge: Record<string, {bg: string, text: string, border: string}> = {
  student: { bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200' },
  teacher: { bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-200' },
  admin:   { bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200' },
};
const statusBadge: Record<string, {bg: string, text: string, border: string}> = {
  active:    { bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200' },
  suspended: { bg:'bg-rose-50',    text:'text-rose-700',    border:'border-rose-200' },
};

export default function AdminUsersPage() {
  const { user }              = useAuth();
  const [users, setUsers]     = useState<User[]>([]);
  const [stats, setStats]     = useState<StatsData>({ totalUsers:0, totalStudents:0, totalTeachers:0, totalAdmins:0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]     = useState<{msg: string, type: string} | null>(null);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params: any = { page, limit:10 };
    if (search)                   params.search = search;
    if (roleFilter !== 'all')     params.role   = roleFilter;
    if (statusFilter !== 'all')   params.status = statusFilter;
    adminApi.getAllUsers(params)
      .then(res => {
        setUsers(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    adminApi.getOverview()
      .then(res => setStats(res.data.data || {}))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  const handleStatusToggle = async (u: User) => {
    const newStatus = u.status === 'suspended' ? 'active' : 'suspended';
    setActionLoading(u._id + '_status');
    try {
      await adminApi.changeStatus(u._id, newStatus);
      setUsers(p => p.map(x => x._id === u._id ? { ...x, status: newStatus } : x));
      showToast(`${u.name} ${newStatus === 'suspended' ? 'suspended' : 'reactivated'} successfully.`);
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Action failed.', 'error');
    } finally { setActionLoading(null); setConfirm(null); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId + '_role');
    try {
      await adminApi.changeRole(userId, newRole);
      setUsers(p => p.map(x => x._id === userId ? { ...x, role: newRole } : x));
      showToast('Role updated successfully.');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Role change failed.', 'error');
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (u: User) => {
    setActionLoading(u._id + '_delete');
    try {
      await adminApi.deleteUser(u._id);
      setUsers(p => p.filter(x => x._id !== u._id));
      showToast(`${u.name} deleted successfully.`);
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Delete failed.', 'error');
    } finally { setActionLoading(null); setConfirm(null); }
  };

  const handleImpersonate = async (u: User) => {
    setActionLoading(u._id + '_imp');
    try {
      const res = await adminApi.impersonate(u._id);
      document.cookie = `token=${res.data.impersonationToken}; path=/; max-age=900`;
      window.location.href = `/dashboard/${u.role}`;
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Impersonation failed.', 'error');
      setActionLoading(null);
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-6 border border-rose-100">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                {confirm.type === 'delete' ? 'Delete User' : confirm.type === 'suspend' ? 'Suspend User' : 'Reactivate User'}
              </h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                {confirm.type === 'delete'
                  ? `This will permanently delete ${confirm.userName} and all their data. This cannot be undone.`
                  : confirm.type === 'suspend'
                  ? `${confirm.userName} will be locked out immediately. You can reactivate them at any time.`
                  : `${confirm.userName} will regain access to their account.`}
              </p>
              <div className="flex gap-4">
                <button onClick={() => setConfirm(null)} className="flex-1 h-12 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 border border-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={() => confirm.type === 'delete' ? handleDelete(confirm.user) : handleStatusToggle(confirm.user)}
                  className={`flex-1 h-12 rounded-xl text-white font-bold shadow-md transition-transform hover:-translate-y-0.5 ${
                    confirm.type === 'reactivate' ? 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700' : 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700'
                  }`}>
                  {confirm.type === 'delete' ? 'Delete' : confirm.type === 'suspend' ? 'Suspend' : 'Reactivate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">User Management</h1>
              <p className="text-slate-500 font-medium">Manage all platform users — students, teachers, and admins.</p>
            </div>
            <Link href="/auth/register" className="flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5">
              <UserPlus size={18} /> Register User
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label:'Total Users', value: stats.totalUsers,    icon: Users,         bg:'bg-slate-50',   color:'text-slate-600', border:'border-slate-200' },
              { label:'Students',    value: stats.totalStudents, icon: GraduationCap, bg:'bg-emerald-50', color:'text-emerald-600', border:'border-emerald-200' },
              { label:'Teachers',    value: stats.totalTeachers, icon: School,        bg:'bg-purple-50',  color:'text-purple-600', border:'border-purple-200' },
              { label:'Admins',      value: stats.totalAdmins,   icon: Shield,        bg:'bg-blue-50',    color:'text-blue-600', border:'border-blue-200' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-[24px] border border-slate-200 p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shrink-0 ${s.bg} ${s.color} ${s.border}`}>
                  <s.icon size={24} />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">{s.value ?? '—'}</p>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-4 mb-6 flex flex-col md:flex-row items-center gap-4 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 pl-10 pr-10 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm cursor-pointer min-w-[140px]"
                  value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r === 'all' ? 'All Roles' : r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                </select>
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 pl-10 pr-10 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm cursor-pointer min-w-[150px]"
                  value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>

              {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
                <button onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setPage(1); }}
                  className="h-12 px-4 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors flex items-center gap-2">
                  <X size={16} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[30%]">User</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[15%]">Role</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[15%]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[15%]">Joined</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[25%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Loading users...</p>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <Search size={24} className="text-slate-400" />
                        </div>
                        <p className="text-lg font-extrabold text-slate-900 mb-1">No users found</p>
                        <p className="text-sm font-medium text-slate-500">Try adjusting your search or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map((u, idx) => {
                      const rb = roleBadge[u.role] || { bg:'bg-slate-50', text:'text-slate-700', border:'border-slate-200' };
                      const sb = statusBadge[u.status] || statusBadge.active;
                      const isMe = u._id === user?._id;

                      return (
                        <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.05, 0.5) }} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${rb.bg} ${rb.text} ${rb.border}`}>
                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate mb-0.5 flex items-center gap-2">
                                  {u.name} {isMe && <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded-md uppercase tracking-wider">You</span>}
                                </p>
                                <p className="text-xs font-medium text-slate-500 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={u.role}
                              disabled={isMe || actionLoading === u._id+'_role'}
                              onChange={e => handleRoleChange(u._id, e.target.value)}
                              className={`appearance-none px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider outline-none transition-all w-28 ${
                                isMe ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'
                              } ${rb.bg} ${rb.text} ${rb.border}`}
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${sb.bg} ${sb.text} ${sb.border}`}>
                              {u.status === 'suspended' ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                              {u.status || 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB',{ day:'numeric', month:'short', year:'numeric' }) : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {!isMe && (
                                <>
                                  <button onClick={() => handleImpersonate(u)} disabled={!!actionLoading} title="Impersonate user"
                                    className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors">
                                    <Eye size={16} />
                                  </button>
                                  {u.role !== 'admin' && (
                                    <button onClick={() => setConfirm({ type: u.status==='suspended' ? 'reactivate' : 'suspend', user: u, userName: u.name })} disabled={!!actionLoading} title={u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                                        u.status === 'suspended' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                      }`}>
                                      {u.status === 'suspended' ? <UserCheck size={16} /> : <Ban size={16} />}
                                    </button>
                                  )}
                                  <button onClick={() => setConfirm({ type:'delete', user: u, userName: u.name })} disabled={!!actionLoading} title="Delete user"
                                    className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination inside table container */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                    className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="h-9 px-4 rounded-lg bg-slate-900 border border-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-slate-900/10">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
