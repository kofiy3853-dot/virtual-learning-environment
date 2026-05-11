'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/utils/api/adminApi';
import { AxiosError } from 'axios';
import Sidebar from '@/components/shared/Sidebar';
import { 
  BookOpen, Search, Filter, Trash2, Archive, ArchiveRestore, 
  UserCog, AlertTriangle, CheckCircle2, X
} from 'lucide-react';

interface Course {
  _id: string;
  code: string;
  title: string;
  status: 'active' | 'draft' | 'archived';
  semester: string;
  academicYear: string;
  enrollmentCount?: number;
  teacher?: Teacher | string;
}

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

interface ConfirmState {
  type: 'delete' | 'archive' | 'reactivate';
  course: Course;
}

const statusColor: Record<string, {bg: string, text: string, border: string}> = {
  active:   { bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200' },
  draft:    { bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200' },
  archived: { bg:'bg-slate-100',  text:'text-slate-600',   border:'border-slate-200' },
};

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [reassignModal, setReassignModal] = useState<Course | null>(null);
  const [newTeacherId, setNewTeacherId]   = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast]     = useState<{msg: string, type: string} | null>(null);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchCourses = useCallback(async (ignore = false) => {
    await Promise.resolve(); // Break synchronous execution to avoid cascading render warning
    if (!ignore) setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const res = await adminApi.getAllCourses(params);
      if (!ignore) {
        setCourses(res.data.data || []);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch {
      if (!ignore) setCourses([]);
    } finally {
      if (!ignore) setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page]);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => fetchCourses(ignore));
    return () => { ignore = true; };
  }, [fetchCourses]);

  useEffect(() => {
    adminApi.getAllUsers({ role:'teacher', limit:100 })
      .then(res => setTeachers(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleStatusChange = async (course: Course, newStatus: 'active' | 'draft' | 'archived') => {
    setActionLoading(course._id + '_status');
    try {
      await adminApi.changeCourseStatus(course._id, newStatus);
      setCourses(p => p.map(c => c._id === course._id ? { ...c, status: newStatus } : c));
      showToast(`Course ${newStatus === 'archived' ? 'archived' : 'reactivated'} successfully.`);
    } catch (e) {
      const err = e as AxiosError<{message: string}>;
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    } finally { setActionLoading(null); setConfirm(null); }
  };

  const handleDelete = async (course: Course) => {
    setActionLoading(course._id + '_delete');
    try {
      await adminApi.deleteCourse(course._id);
      setCourses(p => p.filter(c => c._id !== course._id));
      showToast('Course and all related data deleted.');
    } catch (e) {
      const err = e as AxiosError<{message: string}>;
      showToast(err.response?.data?.message || 'Delete failed.', 'error');
    } finally { setActionLoading(null); setConfirm(null); }
  };

  const handleReassign = async () => {
    if (!newTeacherId || !reassignModal) return;
    setActionLoading(reassignModal._id + '_reassign');
    try {
      await adminApi.reassignTeacher(reassignModal._id, newTeacherId);
      const teacher = teachers.find(t => t._id === newTeacherId);
      setCourses(p => p.map(c => c._id === reassignModal._id ? { ...c, teacher: teacher as Teacher } : c));
      showToast('Teacher reassigned successfully.');
      setReassignModal(null); setNewTeacherId('');
    } catch (e) {
      const err = e as AxiosError<{message: string}>;
      showToast(err.response?.data?.message || 'Reassignment failed.', 'error');
    } finally { setActionLoading(null); }
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
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${
                confirm.type === 'delete' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {confirm.type === 'delete' ? <AlertTriangle size={32} /> : <Archive size={32} />}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                {confirm.type === 'delete' ? 'Delete Course' : confirm.type === 'archive' ? 'Archive Course' : 'Reactivate Course'}
              </h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                {confirm.type === 'delete'
                  ? `This will permanently delete "${confirm.course.title}" and ALL related data — modules, assignments, grades. This cannot be undone.`
                  : confirm.type === 'archive'
                  ? `"${confirm.course.title}" will be archived and hidden from students.`
                  : `"${confirm.course.title}" will be reactivated and visible to students.`}
              </p>
              <div className="flex gap-4">
                <button onClick={() => setConfirm(null)} className="flex-1 h-12 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 border border-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={() => confirm.type === 'delete' ? handleDelete(confirm.course) : handleStatusChange(confirm.course, confirm.type === 'archive' ? 'archived' : 'active')}
                  className={`flex-1 h-12 rounded-xl text-white font-bold shadow-md transition-transform hover:-translate-y-0.5 ${
                    confirm.type === 'delete' ? 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-700' : 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700'
                  }`}>
                  {confirm.type === 'delete' ? 'Delete' : confirm.type === 'archive' ? 'Archive' : 'Reactivate'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reassign Teacher Modal */}
      <AnimatePresence>
        {reassignModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl border border-slate-200"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100">
                <UserCog size={32} />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Reassign Teacher</h3>
              <p className="text-slate-500 font-medium mb-6">Assigning teacher for <span className="text-slate-900 font-bold">{reassignModal.title}</span></p>
              
              <div className="mb-8 relative">
                <label htmlFor="teacher-select" className="sr-only">Choose a new teacher</label>
                <select 
                  id="teacher-select"
                  aria-label="Choose a new teacher"
                  title="Choose a new teacher"
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 px-4 h-14 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold cursor-pointer"
                  value={newTeacherId} onChange={e => setNewTeacherId(e.target.value)}
                >
                  <option value="" disabled>Choose a new teacher...</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">▼</div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setReassignModal(null); setNewTeacherId(''); }} className="flex-1 h-12 rounded-xl bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 border border-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleReassign} disabled={!newTeacherId || !!actionLoading} 
                  className="flex-1 h-12 rounded-xl text-white font-bold bg-blue-600 shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed">
                  {actionLoading ? 'Saving...' : 'Reassign'}
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
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Course Management</h1>
              <p className="text-slate-500 font-medium">Manage all academic courses — reassign teachers, archive, or delete entirely.</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
              <BookOpen size={24} />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-4 mb-6 flex flex-col md:flex-row items-center gap-4 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-12 pr-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm"
                placeholder="Search by course title or code..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            
            <div className="flex w-full md:w-auto items-center gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  aria-label="Filter by Course Status"
                  title="Filter by Course Status"
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 pl-10 pr-10 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-sm cursor-pointer min-w-[150px]"
                  value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {(search || statusFilter !== 'all') && (
                <button onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1); }}
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
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[35%]">Course Details</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[20%]">Teacher</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[15%]">Status</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[10%]">Students</th>
                    <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest w-[20%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Loading courses...</p>
                      </td>
                    </tr>
                  ) : courses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                          <BookOpen size={24} className="text-slate-400" />
                        </div>
                        <p className="text-lg font-extrabold text-slate-900 mb-1">No courses found</p>
                        <p className="text-sm font-medium text-slate-500">Try adjusting your search or filters.</p>
                      </td>
                    </tr>
                  ) : (
                    courses.map((course, idx) => {
                      const sc = statusColor[course.status] || statusColor.archived;

                      return (
                        <motion.tr key={course._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(idx * 0.05, 0.5) }} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold tracking-wider uppercase mb-1">
                                {course.code}
                              </span>
                              <p className="font-extrabold text-slate-900 truncate mb-1">
                                {course.title}
                              </p>
                              <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                                {course.semester} · {course.academicYear}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold text-xs shrink-0">
                                {typeof course.teacher === 'object' && course.teacher?.name ? course.teacher.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <p className="text-sm font-bold text-slate-700 truncate">
                                {typeof course.teacher === 'object' ? course.teacher?.name : 'Unassigned'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${sc.bg} ${sc.text} ${sc.border}`}>
                              {course.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-500">{course.enrollmentCount ?? '—'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setReassignModal(course)} title="Reassign teacher"
                                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                                <UserCog size={16} />
                              </button>
                              {course.status !== 'archived' ? (
                                <button onClick={() => setConfirm({ type:'archive', course })} title="Archive course"
                                  className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center hover:bg-amber-100 transition-colors">
                                  <Archive size={16} />
                                </button>
                              ) : (
                                <button onClick={() => setConfirm({ type:'reactivate', course })} title="Reactivate course"
                                  className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                                  <ArchiveRestore size={16} />
                                </button>
                              )}
                              <button onClick={() => setConfirm({ type:'delete', course })} title="Delete course"
                                className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors">
                                <Trash2 size={16} />
                              </button>
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
