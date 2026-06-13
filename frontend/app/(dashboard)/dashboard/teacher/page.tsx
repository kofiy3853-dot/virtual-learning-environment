'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTeacherStats, useTeacherCourses } from '@/hooks/queries/useTeacherDashboard';
import { courseApi } from '@/utils/api/courseApi';
import { queryKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import AIAssistant from '@/components/dashboard/AIAssistant';
import {
  BookOpen, Plus, Sparkles, Users, Clock, Calendar,
  ArrowRight, CheckCircle2, X, Loader2, Bell, Send,
  Activity, UserPlus, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Course {
  _id: string; code: string; title: string; status: string;
  semester: string; academicYear: string;
  teacher?: { _id: string } | string;
  studentCount?: number;
}

interface UpcomingClass {
  title: string; type: string; time: string; courseId: string; color: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', code: '', description: '', semester: 'Semester 1', academicYear: '2025/2026' });

  const { data: stats = { students: 0, attendance: 0, engagementData: [], upcomingClasses: [] as UpcomingClass[] } } = useTeacherStats(Boolean(user));
  const { data: rawCourses = [], isLoading: loading } = useTeacherCourses(user?._id, Boolean(user));
  const courses = (rawCourses as Course[] || []).filter((c): c is Course => c !== null && c !== undefined);

  const { students, attendance } = stats;
  const isNewUser = !loading && courses.length === 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.code) { toast.error('Title and code required.'); return; }
    setCreating(true);
    const params = new URLSearchParams({ title: form.title, code: form.code });
    router.push(`/admin/courses/new?${params.toString()}`);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const statCards: Array<{
    label: string;
    value: number | string;
    icon: React.ComponentType<any>;
    color: 'blue' | 'emerald' | 'violet';
    trend: string;
    trendUp: boolean;
  }> = [
    {
      label: 'Students',
      value: students,
      icon: Users,
      color: 'blue',
      trend: students === 0 ? 'No students yet' : '+12% this term',
      trendUp: students > 0,
    },
    {
      label: 'Attendance',
      value: attendance > 0 ? `${attendance}%` : '—',
      icon: Activity,
      color: 'emerald',
      trend: 'Across all courses',
      trendUp: attendance > 85,
    },
    {
      label: 'Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'violet',
      trend: courses.length === 0 ? 'Create your first' : 'Active courses',
      trendUp: courses.length > 0,
    },
  ];

  const quickActions = [
    { label: 'Create Course', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', onClick: () => setShowForm(true) },
    { label: 'Schedule Class', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', onClick: () => {} },
    { label: 'Add Students', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', onClick: () => {} },
    { label: 'AI Generator', icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100', onClick: () => router.push('/teacher/ai') },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10 font-sans">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-primary-600 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <Calendar size={12} /><span>{currentDate}</span>
          </div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle mt-0.5">
            {stats.upcomingClasses?.length > 0
              ? `${stats.upcomingClasses.length} classes scheduled today.`
              : 'Your schedule is clear today.'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => router.push('/teacher/ai')} className="btn btn-secondary gap-1.5"><Sparkles size={13} className="text-amber-500" />AI Assistant</button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary gap-1.5"><Plus size={13} />Create Course</button>
        </div>
      </header>

      {/* Onboarding (First-time) */}
      {isNewUser && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-primary-100 rounded-xl p-5 shadow-sm"
        >
          <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Welcome to UniLearn 👋</h2>
          <p className="text-sm text-slate-500 mb-4">Let&apos;s get your workspace ready. Complete these steps to get started.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: 'Create your first course', sub: 'Initialize syllabus & settings.', action: () => setShowForm(true), done: false },
              { label: 'Add your students', sub: 'Invite via email or sync roster.', done: false },
              { label: 'Schedule a class', sub: 'Set up a live lecture or sync.', done: false },
              { label: 'Upload learning material', sub: 'Add slides, docs, and syllabus.', done: false },
            ].map((step, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${i === 0 ? 'border-primary-100 bg-primary-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${i === 0 ? 'bg-primary-600 text-white' : 'border-2 border-slate-300 bg-white'}`}>
                  {i === 0 && <CheckCircle2 size={11} />}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">{step.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.sub}</p>
                  {step.action && <button onClick={step.action} className="mt-1.5 text-[11px] font-semibold text-primary-600 hover:underline">Start now →</button>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      {!isNewUser && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickActions.map(({ label, icon: Icon, color, bg, onClick }) => (
            <button key={label} onClick={onClick}
              className={`flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-left group`}
            >
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center transition-colors shrink-0`}>
                <Icon size={15} className={color} />
              </div>
              <span className="text-[12px] font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, trend, trendUp }) => (
          <StatCard
            key={label}
            icon={<Icon size={17} />}
            label={label}
            value={value}
            trend={trend}
            trendUp={trendUp}
            color={color}
          />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Courses */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-slate-700">Your Courses</h2>
            <Link href="/courses" className="text-[11px] text-primary-600 hover:underline font-medium flex items-center gap-0.5">View all <ArrowRight size={11} /></Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : !isNewUser ? (
            <div className="space-y-2">
              {courses.slice(0, 5).map((course) => (
                <div key={course._id} className="group flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                      <BookOpen size={14} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{course.title}</p>
                      <p className="text-[11px] text-slate-400">{course.studentCount || 0} students · {course.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/courses/${course._id}`} className="btn btn-secondary btn-sm gap-1">
                      Open <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* AI Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
            <div className="flex items-center gap-1.5 text-primary-400 text-[11px] font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={12} />AI Assistant
            </div>
            <p className="text-slate-300 text-[12px] mb-3">What can I help you create today?</p>
            <div className="space-y-1.5 mb-3">
              {['Generate lesson plans', 'Create a quiz draft', 'Analyze performance'].map(s => (
                <button key={s} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-[12px] transition-colors">
                  {s} <ArrowRight size={11} className="text-slate-500" />
                </button>
              ))}
            </div>
            <div className="relative">
              <input aria-label="Ask AI" type="text" placeholder="Ask AI..." className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 text-[12px] outline-none focus:border-primary-500 transition-all" />
              <button aria-label="Send query" className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-primary-600 rounded-md text-white hover:bg-primary-500 transition-colors">
                <Send size={11} />
              </button>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 section-label mb-3">
              <Clock size={12} className="text-amber-500" />Today&apos;s Schedule
            </div>
            {stats.upcomingClasses?.length > 0 ? (
              <div className="space-y-1.5">
                {stats.upcomingClasses.map((item, i) => (
                  <Link key={i} href={`/courses/${item.courseId}/live`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-slate-800 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {item.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-5 text-center">
                <Calendar size={20} className="text-slate-200 mb-2" />
                <p className="text-[12px] text-slate-400">No classes today</p>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 section-label mb-3">
              <Bell size={12} />Recent Activity
            </div>
            {isNewUser ? (
              <p className="text-[12px] text-slate-400 text-center py-3">No activity yet.</p>
            ) : (
              <div className="space-y-2.5">
                {[
                  { dot: 'bg-emerald-500', label: '5 students enrolled', sub: 'Intro to Programming' },
                  { dot: 'bg-primary-500', label: 'AI drafted Quiz 1', sub: 'Ready for review' },
                  { dot: 'bg-amber-500', label: 'System Maintenance', sub: 'Scheduled tonight' },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${a.dot} mt-1.5 shrink-0`} />
                    <div>
                      <p className="text-[12px] font-medium text-slate-800">{a.label}</p>
                      <p className="text-[11px] text-slate-400">{a.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Create Course</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">Start a new course workspace.</p>
                </div>
                <button aria-label="Close" onClick={() => setShowForm(false)} className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">
                  <X size={15} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label htmlFor="courseTitle" className="section-label block mb-1.5">Course Title</label>
                  <input id="courseTitle" required placeholder="e.g. Intro to Programming" className="input-premium" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <label htmlFor="courseCode" className="section-label block mb-1.5">Course Code</label>
                  <input id="courseCode" required placeholder="e.g. CS101" className="input-premium" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">Cancel</button>
                  <button type="submit" disabled={creating} className="btn btn-primary btn-sm gap-1.5">
                    {creating ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                    {creating ? 'Redirecting...' : 'Continue Setup'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Assistant Modal */}
      <AnimatePresence>
        {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
      </AnimatePresence>
    </div>
  );
}


function StatCard({ icon, label, value, trend, trendUp, color }: {
  icon: React.ReactNode,
  label: string,
  value: string | number,
  trend: string,
  trendUp: boolean,
  color: 'blue' | 'emerald' | 'violet'
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h4>
      </div>
    </div>
  );
}
