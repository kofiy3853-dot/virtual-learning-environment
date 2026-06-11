'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { teacherApi } from '@/utils/api/teacherApi';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Filter, BookOpen, FileQuestion, CheckCircle2,
  AlignLeft, ToggleLeft, List, ChevronRight, Inbox,
  Tag, Clock, ArrowUpRight, BarChart2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface QuestionRecord {
  _id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  marks: number;
  order: number;
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseTitle: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  multiple_choice: { label: 'Multiple Choice', icon: List,        color: 'blue'   },
  true_false:      { label: 'True / False',    icon: ToggleLeft,  color: 'violet' },
  short_answer:    { label: 'Short Answer',    icon: AlignLeft,   color: 'amber'  },
};

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-700 border-blue-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  amber:  'bg-amber-50 text-amber-700 border-amber-100',
};

export default function QuestionHistoryPage() {
  const { user } = useAuth();

  const { data: questions = [], isLoading } = useQuery<QuestionRecord[]>({
    queryKey: ['teacher', 'my-questions'],
    queryFn: async () => {
      const res = await teacherApi.getMyQuestions();
      return res.data?.data ?? [];
    },
    enabled: !!user,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [quizFilter, setQuizFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Unique quizzes and courses for filter dropdowns
  const quizOptions = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach(q => map.set(q.quizId, q.quizTitle));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [questions]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    questions.forEach(q => map.set(q.courseId, q.courseTitle));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [questions]);

  const filtered = useMemo(() => {
    return questions.filter(q => {
      const matchSearch = q.text.toLowerCase().includes(search.toLowerCase()) ||
        q.quizTitle.toLowerCase().includes(search.toLowerCase()) ||
        q.courseTitle.toLowerCase().includes(search.toLowerCase());
      const matchType   = typeFilter   === 'all' || q.type     === typeFilter;
      const matchQuiz   = quizFilter   === 'all' || q.quizId   === quizFilter;
      const matchCourse = courseFilter === 'all' || q.courseId === courseFilter;
      return matchSearch && matchType && matchQuiz && matchCourse;
    });
  }, [questions, search, typeFilter, quizFilter, courseFilter]);

  // Stats
  const stats = useMemo(() => ({
    total:  questions.length,
    mc:     questions.filter(q => q.type === 'multiple_choice').length,
    tf:     questions.filter(q => q.type === 'true_false').length,
    sa:     questions.filter(q => q.type === 'short_answer').length,
    quizzes: new Set(questions.map(q => q.quizId)).size,
  }), [questions]);

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <header className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #6366f1 0%, transparent 55%), radial-gradient(circle at 10% 80%, #3b82f6 0%, transparent 55%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
              <FileQuestion size={14} />
              Question Bank
            </div>
            <h1 className="text-2xl font-black tracking-tight">My Question History</h1>
            <p className="text-slate-400 text-sm mt-1">
              All questions you've created across your quizzes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center bg-white/10 rounded-xl px-5 py-3 border border-white/10">
              <p className="text-2xl font-black">{stats.total}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Questions</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl px-5 py-3 border border-white/10">
              <p className="text-2xl font-black">{stats.quizzes}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Quizzes</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stat pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Multiple Choice', count: stats.mc,  color: 'blue',   icon: List       },
          { label: 'True / False',    count: stats.tf,  color: 'violet', icon: ToggleLeft },
          { label: 'Short Answer',    count: stats.sa,  color: 'amber',  icon: AlignLeft  },
          { label: 'Total Marks',
            count: questions.reduce((s, q) => s + (q.marks || 0), 0),
            color: 'emerald', icon: BarChart2 },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className={`rounded-xl border p-4 flex items-center gap-3 ${
            color === 'blue'    ? 'bg-blue-50 border-blue-100'     :
            color === 'violet'  ? 'bg-violet-50 border-violet-100' :
            color === 'amber'   ? 'bg-amber-50 border-amber-100'   :
            'bg-emerald-50 border-emerald-100'
          }`}>
            <Icon size={18} className={
              color === 'blue'    ? 'text-blue-500'    :
              color === 'violet'  ? 'text-violet-500'  :
              color === 'amber'   ? 'text-amber-500'   :
              'text-emerald-500'
            } />
            <div>
              <p className="text-lg font-black text-slate-900">{count}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={15} />
          <input
            type="text"
            placeholder="Search questions, quizzes, courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary-400 outline-none bg-white text-slate-700"
          >
            <option value="all">All Types</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>

        {/* Course filter */}
        {courseOptions.length > 1 && (
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary-400 outline-none bg-white text-slate-700"
          >
            <option value="all">All Courses</option>
            {courseOptions.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        )}

        {/* Quiz filter */}
        {quizOptions.length > 1 && (
          <select
            value={quizFilter}
            onChange={e => setQuizFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-primary-400 outline-none bg-white text-slate-700"
          >
            <option value="all">All Quizzes</option>
            {quizOptions.map(q => (
              <option key={q.id} value={q.id}>{q.title}</option>
            ))}
          </select>
        )}

        {/* Results count */}
        <span className="ml-auto self-center text-xs text-slate-400 font-semibold shrink-0">
          {filtered.length} of {questions.length} questions
        </span>
      </div>

      {/* ── Question list ── */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Inbox size={28} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {questions.length === 0 ? 'No questions yet' : 'No questions match your filters'}
          </h3>
          <p className="text-slate-400 text-sm">
            {questions.length === 0
              ? 'Create quizzes and add questions to see them here.'
              : 'Try adjusting your search or filters.'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((q, idx) => {
              const typeInfo = TYPE_LABELS[q.type] ?? { label: q.type, icon: FileQuestion, color: 'blue' };
              const TypeIcon = typeInfo.icon;
              return (
                <motion.div
                  key={q._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  className="group bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-primary-200 hover:shadow-md transition-all flex gap-4 items-start"
                >
                  {/* Index bubble */}
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all mt-0.5">
                    {idx + 1}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {q.text}
                    </p>

                    {/* Options preview for MC */}
                    {q.type === 'multiple_choice' && q.options && q.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {q.options.slice(0, 4).map((opt, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-[11px] text-slate-500">
                            <span className="font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span>
                            {opt || <span className="italic">—</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {/* Type badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${COLOR_MAP[typeInfo.color]}`}>
                        <TypeIcon size={10} />
                        {typeInfo.label}
                      </span>

                      {/* Marks */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Tag size={10} /> {q.marks} pts
                      </span>

                      {/* Divider */}
                      <span className="w-1 h-1 rounded-full bg-slate-200" />

                      {/* Course */}
                      <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <BookOpen size={11} className="text-slate-400" />
                        {q.courseTitle}
                      </span>

                      <ChevronRight size={11} className="text-slate-300" />

                      {/* Quiz link */}
                      <Link
                        href={`/courses/${q.courseId}/quizzes/${q.quizId}`}
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Clock size={11} />
                        {q.quizTitle}
                        <ArrowUpRight size={10} />
                      </Link>
                    </div>
                  </div>

                  {/* Go to quiz CTA */}
                  <Link
                    href={`/courses/${q.courseId}/quizzes/${q.quizId}`}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-all px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 border border-primary-100 hover:bg-primary-100 text-[11px] font-semibold flex items-center gap-1 self-center"
                  >
                    View Quiz <ArrowUpRight size={11} />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
