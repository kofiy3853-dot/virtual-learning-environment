'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCourseAssignments } from '@/hooks/queries/useCourseResources';
import {
  Calendar, Trophy,
  Plus, CheckCircle2, AlertCircle, LucideIcon,
  ArrowRight, Inbox, Activity, Search,
  ChevronUp
} from 'lucide-react';

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
  submitted: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-100', label: 'Submitted', icon: CheckCircle2 },
  graded: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Graded', icon: Trophy },
  late: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', label: 'Overdue', icon: AlertCircle },
  pending: { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', label: 'Pending', icon: Activity },
};

function daysLeft(dueDate: string) {
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { text: 'Past Due', color: 'text-rose-500', bg: 'bg-rose-50' };
  if (days === 0) return { text: 'Due Today', color: 'text-amber-500', bg: 'bg-amber-50' };
  if (days === 1) return { text: '1 Day Left', color: 'text-amber-500', bg: 'bg-amber-50' };
  return { text: `${days} Days Left`, color: 'text-slate-400', bg: 'bg-slate-50' };
}

export default function AssignmentsPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const { data: assignmentData, isLoading: loading } = useCourseAssignments(courseId, { isStudent });

  const assignments = (assignmentData?.assignments ?? []) as Assignment[];
  const submissions = (assignmentData?.submissions ?? {}) as unknown as Record<string, Submission>;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('dueDate');

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const onScroll = () => setShowScrollTop(mainEl.scrollTop > 300);
    mainEl.addEventListener('scroll', onScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- Computed stats from real data ---
  const totalSubmissions = Object.keys(submissions).length;
  const pendingReviews = Object.values(submissions).filter(s => s.status === 'submitted').length;
  const overdueCount = assignments.filter(
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
        if (statusFilter === 'graded') return status === 'graded';
        if (statusFilter === 'late') return status === 'late';
        if (statusFilter === 'pending') return !sub || status === 'pending';
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
    <div className="space-y-4 pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle mt-0.5">Manage coursework, submissions, and grading.</p>
        </div>

        {isTeacher && (
          <Link
            href={`/courses/${courseId}/assignments/new`}
            className="btn btn-primary btn-sm gap-1.5 self-start sm:self-auto"
          >
            <Plus size={14} /> Create Assignment
          </Link>
        )}
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="stat-card">
          <p className="section-label mb-1">Total</p>
          <p className="text-xl font-bold text-slate-900">{assignments.length}</p>
        </div>
        <div className="stat-card">
          <p className="section-label mb-1">Pending Review</p>
          <p className="text-xl font-bold text-amber-600">{pendingReviews}</p>
        </div>
        <div className="stat-card">
          <p className="section-label mb-1">Submissions</p>
          <p className="text-xl font-bold text-blue-600">{totalSubmissions}</p>
        </div>
        <div className="stat-card">
          <p className="section-label mb-1">Overdue</p>
          <p className="text-xl font-bold text-rose-600">{overdueCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            aria-label="Search assignments"
            className="input-premium pl-8 h-8 text-xs w-full"
            placeholder="Search assignments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-premium h-8 py-0 text-xs w-28 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="late">Overdue</option>
            <option value="pending">Pending</option>
          </select>
          <select
            aria-label="Sort assignments"
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="input-premium h-8 py-0 text-xs w-28 cursor-pointer"
          >
            <option value="dueDate">By Due Date</option>
            <option value="points">By Points</option>
          </select>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
          <Inbox size={20} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Assignments Yet</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {search || statusFilter !== 'all'
              ? 'No assignments match your filters.'
              : 'No assignments have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredAssignments.map((a) => {
            const dl = daysLeft(a.dueDate);
            const sub = submissions[a._id];
            const sb = statusBadge[sub?.status || 'pending'];
            const StatusIcon = sb.icon;

            return (
              <div key={a._id} className="bg-white border border-slate-100 rounded-xl p-3 hover:border-slate-200 hover:shadow-sm transition-all flex flex-col group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[13px] font-semibold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors" title={a.title}>
                    {a.title}
                  </h3>
                  {isStudent && (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold shrink-0 border ${sb.bg} ${sb.text} ${sb.border}`}>
                      <StatusIcon size={10} /> {sb.label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Calendar size={12} className="text-slate-400" />
                    <span className={dl.color}>{dl.text}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Trophy size={12} className="text-slate-400" />
                    <span>{a.totalMarks} pts</span>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-1.5">
                  <Link
                    href={`/courses/${courseId}/assignments/${a._id}`}
                    className="btn btn-secondary btn-sm flex-1 justify-center gap-1 text-[11px]"
                  >
                    {isTeacher ? 'Manage' : isStudent && !sub ? 'Start' : 'View'} <ArrowRight size={10} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scroll to top FAB */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 w-8 h-8 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
        >
          <ChevronUp size={16} />
        </button>
      )}
    </div>
  );
}
