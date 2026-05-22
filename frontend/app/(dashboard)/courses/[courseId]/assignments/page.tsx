'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/hooks/queries/useCourse';
import { useCourseAssignments } from '@/hooks/queries/useCourseResources';
import { 
  FileText, Calendar, Clock, Trophy, 
  Plus, Loader2, CheckCircle2, AlertCircle, LucideIcon,
  ArrowRight, Inbox, TrendingUp, Activity, Search,
  ArrowLeft, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
}

interface Submission {
  _id: string;
  assignment: string;
  status: 'submitted' | 'graded' | 'late' | 'pending';
  grade?: number;
}

const statusBadge: Record<string, { bg: string, text: string, border: string, label: string, icon: LucideIcon }> = {
  submitted: { bg:'bg-primary-50', text:'text-primary-600', border:'border-primary-100', label:'Submitted', icon: CheckCircle2 },
  graded:    { bg:'bg-emerald-50', text:'text-emerald-600', border:'border-emerald-100', label:'Graded', icon: Trophy },
  late:      { bg:'bg-rose-50',    text:'text-rose-600',    border:'border-rose-100',    label:'Overdue', icon: AlertCircle },
  pending:   { bg:'bg-slate-50',   text:'text-slate-400',   border:'border-slate-100',   label:'Pending', icon: Activity },
};

function daysLeft(dueDate: string) {
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: 'Deadline Passed', color: 'text-rose-500', bg: 'bg-rose-50' };
  if (days === 0) return { text: 'Due Today', color: 'text-amber-500', bg: 'bg-amber-50' };
  if (days === 1) return { text: '1 Day Remaining', color: 'text-amber-500', bg: 'bg-amber-50' };
  return { text: `${days} Days Remaining`, color: 'text-slate-400', bg: 'bg-slate-50' };
}

export default function AssignmentsPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const { user } = useAuth();

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const { data: course } = useCourse(courseId);
  const { data: assignmentData, isLoading: loading } = useCourseAssignments(courseId, { isStudent });

  const assignments  = (assignmentData?.assignments ?? []) as Assignment[];
  const submissions  = (assignmentData?.submissions ?? {}) as unknown as Record<string, Submission>;

  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey,    setSortKey]    = useState('dueDate');

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // --- Computed stats from real data ---
  const totalSubmissions = Object.keys(submissions).length;
  const pendingReviews   = Object.values(submissions).filter(s => s.status === 'submitted').length;
  const overdueCount     = assignments.filter(
    a => new Date(a.dueDate) < new Date() && !submissions[a._id]
  ).length;

  // --- Filter + Sort pipeline ---
  const filteredAssignments = useMemo(() => {
    let result = assignments.filter(a =>
      a.title.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== 'all') {
      result = result.filter(a => {
        const sub = submissions[a._id];
        const status = sub?.status ?? 'pending';
        if (statusFilter === 'submitted') return status === 'submitted';
        if (statusFilter === 'graded')    return status === 'graded';
        if (statusFilter === 'late')      return status === 'late';
        if (statusFilter === 'pending')   return !sub || status === 'pending';
        return true;
      });
    }

    if (sortKey === 'dueDate') {
      result = [...result].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } else if (sortKey === 'points') {
      result = [...result].sort((a, b) => b.totalMarks - a.totalMarks);
    }

    return result;
  }, [assignments, submissions, search, statusFilter, sortKey]);

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4 flex-1">
          {/* Back button */}
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            aria-label="Back to course overview"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-bold text-sm uppercase tracking-widest transition-colors group mb-2"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Course
          </button>
          <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
            Assignments
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
            Manage coursework, submissions, and grading.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {isTeacher && (
            <Link
              href={`/courses/${courseId}/assignments/new`}
              className="btn btn-primary h-14 px-8 gap-3 text-sm font-bold shadow-2xl shadow-primary-500/20 w-full sm:w-auto flex items-center justify-center rounded-xl"
            >
              <Plus size={18} strokeWidth={3} /> Create Assignment
            </Link>
          )}
        </div>
      </header>

      {/* Overview Cards — all driven by real data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 mb-2">Total Assignments</p>
          <p className="text-3xl font-black text-slate-900">{assignments.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 mb-2">Pending Reviews</p>
          <p className="text-3xl font-black text-amber-500">{pendingReviews}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 mb-2">Total Submissions</p>
          <p className="text-3xl font-black text-blue-500">{totalSubmissions}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-500 mb-2">Overdue</p>
          <p className="text-3xl font-black text-rose-500">{overdueCount}</p>
        </div>
      </div>

      {/* Filters — fully functional */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            aria-label="Search assignments"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 h-12 text-sm font-bold focus:border-primary-500 outline-none transition-all"
            placeholder="Search assignments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-700 outline-none min-w-[140px]"
          >
            <option value="all">Status: All</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="late">Overdue</option>
            <option value="pending">Pending</option>
          </select>
          <select
            aria-label="Sort assignments"
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-700 outline-none min-w-[140px]"
          >
            <option value="dueDate">Sort: Due Date</option>
            <option value="points">Sort: Points</option>
          </select>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-[48px] bg-white border border-slate-100 animate-pulse shadow-sm" />)}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="py-40 text-center bg-white rounded-[64px] border border-slate-100 shadow-2xl shadow-primary-500/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="w-28 h-28 bg-slate-50 rounded-[40px] shadow-inner mx-auto flex items-center justify-center mb-10 border border-slate-100 group-hover:scale-110 transition-transform duration-700 relative z-10">
            <Inbox size={48} className="text-slate-200" />
          </div>
          <h3 className="text-3xl font-display font-extrabold text-slate-900 mb-3 relative z-10">No Assignments Yet</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mb-12 text-lg relative z-10">
            {search || statusFilter !== 'all'
              ? 'No assignments match your current filters.'
              : 'No assignments have been created for this course yet.'}
          </p>
          {isTeacher && !search && statusFilter === 'all' && (
            <button
              onClick={() => router.push(`/courses/${courseId}/assignments/new`)}
              className="btn btn-primary h-16 px-12 text-[10px] font-black uppercase tracking-widest relative z-10"
            >
              Create First Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAssignments.map((a, idx) => {
            const dl = daysLeft(a.dueDate);
            const sub = submissions[a._id];
            const sb = statusBadge[sub?.status || 'pending'];
            const StatusIcon = sb.icon;

            return (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-[40px] border border-slate-100 p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-700 relative overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="flex flex-col sm:flex-row gap-10 items-center flex-1 min-w-0 relative z-10">
                  <div className="w-20 h-20 rounded-[28px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-all duration-700 shadow-inner group-hover:shadow-xl group-hover:shadow-primary-500/20 group-hover:-rotate-3">
                    <FileText size={32} />
                  </div>

                  <div className="space-y-4 flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap justify-center sm:justify-start">
                      <h3 className="text-2xl font-display font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors tracking-tight truncate max-w-md">{a.title}</h3>
                      {isStudent && (
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${sb.bg} ${sb.text} ${sb.border}`}>
                          <StatusIcon size={14} /> {sb.label}
                        </div>
                      )}
                    </div>

                    {a.description && <p className="text-slate-500 font-medium line-clamp-1 leading-relaxed max-w-2xl text-sm">{a.description}</p>}

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-10 gap-y-4 pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={14} className="text-primary-500" />
                        {new Date(a.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${dl.color}`}>
                        <Clock size={14} /> {dl.text}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        <Trophy size={14} /> {a.totalMarks} pts
                      </div>
                      {sub?.grade !== undefined && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                          <TrendingUp size={14} /> {sub.grade}/{a.totalMarks} Grade
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-4 shrink-0 relative z-10">
                  <Link
                    href={`/courses/${courseId}/assignments/${a._id}`}
                    className={`h-16 px-12 rounded-[24px] font-display font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all duration-500 shadow-xl active:scale-95 ${
                      isStudent && !sub
                        ? 'bg-primary-500 text-white shadow-primary-500/20 hover:bg-primary-600'
                        : 'bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800'
                    }`}
                  >
                    {isTeacher ? 'Manage' : isStudent && !sub ? 'Start' : 'View'}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Scroll to top FAB */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-2xl shadow-slate-900/30 flex items-center justify-center hover:bg-primary-600 hover:-translate-y-1 active:scale-95 transition-all duration-300"
        >
          <ChevronUp size={22} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
