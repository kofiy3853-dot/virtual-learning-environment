'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCourseQuizzes } from '@/hooks/queries/useCourseResources';
import {
  Clock, Trophy, Plus,
  ArrowRight, Inbox, Search,
  Target, FlaskConical, CheckCircle2
} from 'lucide-react';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  totalMarks?: number;
  isPublished?: boolean;
  questionCount?: number;
  questions?: unknown[];
  startTime?: string;
  endTime?: string;
}

export default function QuizzesPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const { data: quizzes = [], isLoading: loading } = useCourseQuizzes(courseId);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredQuizzes = useMemo(() => {
    let result = (quizzes as Quiz[]).filter((q: Quiz) =>
      q.title.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter === 'published') result = result.filter(q => q.isPublished);
    if (statusFilter === 'draft') result = result.filter(q => !q.isPublished);
    return result;
  }, [quizzes, search, statusFilter]);

  const stats = {
    total: (quizzes as Quiz[]).length,
    published: (quizzes as Quiz[]).filter((q: Quiz) => q.isPublished).length,
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-widest">
              <FlaskConical size={14} /> Assessments & Evaluations
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Quizzes &amp; Assessments
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              Take quizzes, track scores, and review your performance across all assessments.
            </p>
          </div>

          {isTeacher && (
            <Link 
              href={`/courses/${courseId}/quizzes/new`} 
              className="btn btn-primary h-12 px-6 gap-2 text-xs font-bold shadow-sm transition-all rounded-xl self-start md:self-auto"
            >
              <Plus size={16} /> Create Quiz
            </Link>
          )}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
            <Trophy size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Quizzes</p>
            <p className="text-2xl font-extrabold text-slate-900">{stats.total}</p>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Published</p>
            <p className="text-2xl font-extrabold text-emerald-600">{stats.published}</p>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.published / stats.total) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Clock size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drafts</p>
            <p className="text-2xl font-extrabold text-amber-600">{stats.total - stats.published}</p>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${((stats.total - stats.published) / stats.total) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Target size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Questions</p>
            <p className="text-2xl font-extrabold text-blue-600">
              {(quizzes as Quiz[]).reduce((s: number, q: Quiz) => s + (q.questionCount ?? q.questions?.length ?? 0), 0)}
            </p>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search quizzes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-12 pr-4 h-12 rounded-xl focus:border-primary-500 transition-all outline-none font-bold text-xs shadow-sm"
          />
        </div>
        {isTeacher && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 px-4 h-12 rounded-xl focus:border-primary-500 transition-all outline-none font-bold text-xs shadow-sm cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        )}
      </div>

      {/* Quiz List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 animate-pulse shadow-sm" />)}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm relative group overflow-hidden"
        >
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
              <Inbox size={36} className="text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {search || statusFilter !== 'all' ? 'No quizzes found' : 'No quizzes yet'}
              </h3>
              <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                {search || statusFilter !== 'all' ? 'No quizzes match your filters.' : 'No quizzes have been created yet.'}
              </p>
            </div>
            {isTeacher && !search && statusFilter === 'all' && (
              <Link href={`/courses/${courseId}/quizzes/new`} className="btn btn-primary h-12 px-6 text-xs font-bold shadow-sm">
                Create First Quiz
              </Link>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((q, idx) => (
            <motion.div
              key={q._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-primary-200 hover:shadow-lg transition-all flex flex-col group"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors tracking-tight line-clamp-2">
                    {q.title}
                  </h3>
                  {q.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{q.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 border shadow-sm ${
                  q.isPublished
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {q.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 py-4 border-y border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Target size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Questions</p>
                    <p className="text-sm font-bold text-slate-900">{q.questionCount ?? q.questions?.length ?? 0}</p>
                  </div>
                </div>

                {q.duration && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Duration</p>
                      <p className="text-sm font-bold text-slate-900">{q.duration} min</p>
                    </div>
                  </div>
                )}

                {q.totalMarks && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <Trophy size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Points</p>
                      <p className="text-sm font-bold text-slate-900">{q.totalMarks}</p>
                    </div>
                  </div>
                )}

                {q.startTime && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <FlaskConical size={14} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Starts</p>
                      <p className="text-sm font-bold text-slate-900">{new Date(q.startTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href={`/courses/${courseId}/quizzes/${q._id}`}
                className="btn btn-primary w-full justify-center gap-2 text-xs font-bold shadow-sm mt-auto"
              >
                {isTeacher ? 'Manage' : isStudent ? 'Start Quiz' : 'View'} <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
