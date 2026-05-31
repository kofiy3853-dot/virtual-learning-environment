'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { useCoursesCatalog, useEnrolledCourseIds } from '@/hooks/queries/useCoursesCatalog';
import { queryKeys } from '@/lib/queryKeys';
import { AxiosError } from 'axios';
import {
  Search, Plus, BookOpen, User,
  ChevronRight, ChevronLeft, AlertCircle, CheckCircle2,
  SlidersHorizontal, Trash2, ArrowUpRight, Award
} from 'lucide-react';

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  active:   { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  draft:    { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200'   },
  archived: { bg: 'bg-slate-100',   text: 'text-slate-500',   border: 'border-slate-200'   },
};

export default function CoursesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  const catalogParams = {
    ...(search ? { search } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    page,
  };

  const { data: catalogResponse, isLoading: loading } = useCoursesCatalog(catalogParams, {
    teacherId: user?._id,
    isTeacher,
    enabled: Boolean(user),
  });
  const courses = catalogResponse?.data || [];
  const pagination = catalogResponse?.pagination;
  const { data: enrolled = new Set<string>() } = useEnrolledCourseIds(isStudent);

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);
    try {
      await courseApi.enroll(courseId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.enrolled });
      showToast('Enrolled successfully!');
    } catch (err: unknown) {
      let msg = 'Failed to enroll';
      if (err instanceof AxiosError) msg = err.response?.data?.message || msg;
      showToast(msg, 'error');
    } finally {
      setEnrolling(null);
    }
  };

  const handleDelete = async (courseId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await courseApi.delete(courseId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      showToast('Course deleted.');
    } catch (err: unknown) {
      let msg = 'Failed to delete course';
      if (err instanceof AxiosError) msg = err.response?.data?.message || msg;
      showToast(msg, 'error');
    }
  };

  const filterTabs = ['all', 'active', 'draft', 'archived'];

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -12, x: '-50%' }}
            className={`fixed top-4 left-1/2 z-[100] px-4 py-2.5 rounded-xl font-medium shadow-xl border flex items-center gap-2 text-sm ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-widest">
              <BookOpen size={14} /> {isTeacher ? 'Teaching' : 'Learning'}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {isTeacher ? 'My Courses' : 'Course Library'}
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              {isTeacher
                ? 'Manage your curriculum and track student progress'
                : 'Explore and enroll in available courses'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search courses..."
                className="pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm w-56"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {user?.role === 'admin' && (
              <Link href="/admin/courses/new" className="btn btn-primary h-10 px-4 gap-2 text-xs font-bold rounded-xl">
                <Plus size={16} />
                New Course
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 px-1">
        {filterTabs.map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`relative px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === status
                ? 'text-primary-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {status}
            {statusFilter === status && (
              <motion.div
                layoutId="status-indicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <section>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-slate-100">
              <BookOpen size={32} className="text-slate-300" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">No courses found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course, idx) => {
              const isEnrolled = enrolled.has(course._id);
              const status = statusColor[course.status] || statusColor.active;
              const teacherName = typeof course.teacher === 'object'
                ? course.teacher?.name
                : 'Academic Faculty';

              return (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-primary-200 hover:shadow-lg transition-all duration-200"
                >
                  {/* Card header — thumbnail or gradient */}
                  <div className="h-32 relative shrink-0 overflow-hidden">
                    {course.thumbnail && !course.thumbnail.includes('no-course-thumbnail') ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800" />
                    )}
                    {/* Gradient overlay for readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-black/30 border border-white/20 text-white text-[10px] font-bold backdrop-blur-sm">
                        {course.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-sm bg-white/80 ${status.text} ${status.border}`}>
                        {course.status}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      {course.certificateEnabled && (
                        <span title="Certificate enabled" className="w-6 h-6 rounded-lg bg-amber-400/90 backdrop-blur-sm flex items-center justify-center">
                          <Award size={12} className="text-white" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {course.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        <User size={12} className="text-primary-600" />
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate" title={teacherName}>{teacherName}</p>
                    </div>

                    {/* Action button */}
                    {isStudent ? (
                      isEnrolled ? (
                        <Link
                          href={`/courses/${course._id}`}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all mt-2"
                        >
                          Continue <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course._id)}
                          disabled={enrolling === course._id}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:text-primary-600 text-slate-700 text-xs font-bold transition-all mt-2 disabled:opacity-60"
                        >
                          {enrolling === course._id ? 'Enrolling...' : 'Enroll'}
                        </button>
                      )
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <Link
                          href={`/courses/${course._id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:text-primary-600 text-slate-700 text-xs font-bold transition-all"
                        >
                          Open <ArrowUpRight size={12} />
                        </Link>
                        <button
                          onClick={() => handleDelete(course._id, course.title)}
                          className="w-10 h-10 rounded-xl border border-rose-200 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                          title="Delete Course"
                          aria-label={`Delete course ${course.title}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          
          <span className="text-sm font-medium text-slate-500">
            Page {page} of {pagination.pages}
          </span>
          
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
