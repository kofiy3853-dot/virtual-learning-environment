'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { Course } from '@/types';
import { AxiosError } from 'axios';
import { 
  Search, Filter, Plus, BookOpen, User, 
  ChevronRight, Sparkles, AlertCircle, CheckCircle2,
  SlidersHorizontal, LayoutGrid, List, Trash2
} from 'lucide-react';
const statusColor: Record<string, { bg: string, text: string, border: string }> = {
  active:   { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-100' },
  draft:    { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-100' },
  archived: { bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200' },
};

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (isStudent) {
      courseApi.getMyCourses()
        .then(res => {
          const ids = new Set<string>((res.data.data || []).map((c: Course) => c._id));
          setEnrolled(ids);
        })
        .catch(() => {});
    }
  }, [isStudent]);

  const fetchCourses = useCallback(() => {
    const params: { search?: string; status?: string } = {};
    if (search) params.search = search;
    if (statusFilter !== 'all') params.status = statusFilter;
    
    courseApi.getAll(params)
      .then(res => {
        let all: Course[] = res.data.data || [];
        if (isTeacher) {
          all = all.filter((c: Course) => {
            const tId = typeof c.teacher === 'object' ? c.teacher?._id : c.teacher;
            return tId === user?._id;
          });
        }
        setCourses(all);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter, isTeacher, user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await courseApi.enroll(courseId);
      setEnrolled(prev => new Set([...prev, courseId]));
      showToast('Successfully enrolled in course!');
    } catch (err: unknown) {
      let msg = 'Failed to enroll';
      if (err instanceof AxiosError) msg = err.response?.data?.message || msg;
      showToast(msg, 'error');
    } finally {
      setEnrolling(null);
    }
  };

  const handleDelete = async (courseId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      await courseApi.delete(courseId);
      showToast('Course deleted successfully');
      fetchCourses();
    } catch (err: unknown) {
      let msg = 'Failed to delete course';
      if (err instanceof AxiosError) msg = err.response?.data?.message || msg;
      showToast(msg, 'error');
    }
  };

  return (
    <div className="space-y-10 pb-20">
        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }} 
              animate={{ opacity: 1, y: 0, x: '-50%' }} 
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              className={`fixed top-12 left-1/2 z-[100] px-6 py-4 rounded-2xl font-bold shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
                toast.type === 'error' ? 'bg-red-50/90 text-red-700 border-red-200' : 'bg-emerald-50/90 text-emerald-700 border-emerald-200'
              }`}
            >
              {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="text-sm tracking-tight">{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
              Course <span className="text-gradient">Library</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-xl">
              {isTeacher 
                ? 'Manage your academic curriculum and track institutional impact.' 
                : 'Accelerate your learning journey with our world-class curriculum.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[320px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search modules..."
                className="input-premium pl-11 pr-4 h-12 text-sm font-medium shadow-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            
            <button className="btn btn-secondary h-12 px-4 gap-2">
              <SlidersHorizontal size={18} /> Filters
            </button>

            {user?.role === 'admin' && (
              <Link href="/admin/courses/new" className="btn btn-primary h-12 px-6 gap-2">
                <Plus size={18} strokeWidth={3} /> Create Module
              </Link>
            )}
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="flex items-center gap-2 border-b border-slate-100 pb-1 overflow-x-auto no-scrollbar">
          {['all', 'active', 'draft', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative ${
                statusFilter === status ? 'text-primary-500' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {status}
              {statusFilter === status && (
                <motion.div layoutId="status-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
              )}
            </button>
          ))}
        </section>

        {/* Courses Grid */}
        <section className="min-h-[400px]">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 rounded-3xl bg-slate-50 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="py-20 text-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center mb-6 border border-slate-100">
                <BookOpen size={28} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Modules Found</h3>
              <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium">Try adjusting your search or filters to find what you're looking for.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, idx) => {
                const isEnrolled = enrolled.has(course._id);
                const status = statusColor[course.status] || statusColor.active;
                const teacherName = typeof course.teacher === 'object' ? course.teacher?.name : 'Academic Faculty';

                return (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group card-premium card-premium-hover p-0 overflow-hidden flex flex-col h-full border-slate-100/50"
                  >
                    <div className="h-40 bg-slate-900 relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80 z-10" />
                      <div className="absolute top-4 left-4 z-20 flex gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                          {course.code}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${status.bg} ${status.text} ${status.border}`}>
                          {course.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                      <h3 className="text-lg font-display font-extrabold text-slate-900 mb-3 group-hover:text-primary-500 transition-colors leading-tight line-clamp-2 min-h-[3rem]">
                        {course.title}
                      </h3>
                      <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-8 leading-relaxed">
                        {course.description || 'No description provided for this academic program.'}
                      </p>

                      <div className="mt-auto space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-primary-200 group-hover:bg-primary-50 transition-colors">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Faculty</p>
                            <p className="text-sm font-bold text-slate-700 leading-none truncate" title={teacherName}>{teacherName}</p>
                          </div>
                        </div>

                        {isStudent ? (
                          isEnrolled ? (
                            <Link 
                              href={`/courses/${course._id}`}
                              className="btn btn-primary w-full h-12 shadow-lg shadow-primary-500/20 group/btn"
                            >
                              Continue Workspace <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                          ) : (
                            <button 
                              onClick={() => handleEnroll(course._id)}
                              disabled={enrolling === course._id}
                              className="btn btn-secondary w-full h-12 hover:border-primary-500 hover:text-primary-500 transition-all font-black"
                            >
                              {enrolling === course._id ? 'Provisioning...' : 'Enroll in Module'}
                            </button>
                          )
                        ) : (
                          <div className="flex gap-2">
                            <Link 
                              href={`/courses/${course._id}`}
                              className="btn btn-secondary flex-1 h-12 hover:border-primary-500 hover:text-primary-500 transition-all font-black"
                            >
                              Enter Hub <ChevronRight size={16} />
                            </Link>
                            <button 
                              onClick={() => handleDelete(course._id, course.title)}
                              className="w-12 h-12 rounded-[0.75rem] border border-red-100 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                              title="Delete Course"
                              aria-label={`Delete course ${course.title}`}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
  );
}
