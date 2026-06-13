'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useStudentDashboard } from '@/hooks/queries/useStudentDashboard';
import {
  BookOpen, Play, Activity, Star, CheckCircle2, TrendingUp, Clock, ArrowRight,
  Calendar, Sparkles, Target, Zap, AlertCircle, ArrowUpRight, ArrowDownRight,
  GraduationCap, Bell, MessageSquare, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading } = useStudentDashboard(Boolean(user));

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const stats = data?.stats ?? {
    gpa: 0,
    attendance: 0,
    assignmentsSubmitted: 0,
    onTimeRate: 100,
    overallCompletion: 0,
    studyHours: 0,
    totalCourses: 0,
  };

  const courses = data?.courses ?? [];
  const milestones = data?.milestones ?? [];
  const isNewUser = !isLoading && courses.length === 0;

  const statCards: Array<{
    label: string;
    value: number | string;
    icon: React.ComponentType<any>;
    color: 'blue' | 'emerald' | 'violet' | 'indigo';
    trend: string;
    trendUp: boolean;
  }> = [
    {
      label: 'GPA',
      value: stats.gpa || '—',
      icon: Star,
      color: 'blue',
      trend: stats.gpa > 3.5 ? 'Excellent' : stats.gpa > 3.0 ? 'Good' : 'Keep improving',
      trendUp: stats.gpa > 3.0,
    },
    {
      label: 'Attendance',
      value: `${stats.attendance || 0}%`,
      icon: Activity,
      color: 'emerald',
      trend: stats.attendance > 90 ? 'Excellent' : 'Above average',
      trendUp: stats.attendance > 85,
    },
    {
      label: 'Completion',
      value: `${stats.overallCompletion || 0}%`,
      icon: CheckCircle2,
      color: 'violet',
      trend: `${stats.assignmentsSubmitted} submitted`,
      trendUp: stats.onTimeRate > 80,
    },
    {
      label: 'Study Hours',
      value: stats.studyHours || 0,
      icon: Clock,
      color: 'indigo',
      trend: 'This week',
      trendUp: true,
    },
  ];

  const quickActions = [
    { label: 'My Courses', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', onClick: () => router.push('/courses') },
    { label: 'AI Tutor', icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100', onClick: () => router.push('/ai-tutor') },
    { label: 'Progress', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', onClick: () => router.push('/radar') },
    { label: 'Messages', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', onClick: () => router.push('/messages') },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 font-sans">
      {/* Header Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-widest mb-2">
              <Calendar size={14} />
              <span>{currentDate}</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              {milestones?.length > 0
                ? `${milestones.length} upcoming deadlines - Stay on top of your coursework`
                : 'Stay on top of your coursework'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button className="btn btn-secondary h-10 px-4 gap-2 text-xs font-bold rounded-xl">
              <Sparkles size={14} className="text-amber-500" />
              AI Tutor
            </button>
            <Link href="/courses" className="btn btn-primary h-10 px-4 gap-2 text-xs font-bold rounded-xl">
              <Play size={14} fill="currentColor" />
              Continue Learning
            </Link>
          </div>
        </div>
      </section>

      {/* Onboarding (First-time) */}
      {isNewUser && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-primary-100 rounded-xl p-5 shadow-sm"
        >
          <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Welcome to UniLearn 👋</h2>
          <p className="text-sm text-slate-500 mb-4">Let&apos;s get you started on your learning journey.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { label: 'Explore courses', sub: 'Browse and enroll in available courses.', action: () => router.push('/courses'), done: false },
              { label: 'Meet your instructors', sub: 'Connect with your teachers and classmates.', done: false },
              { label: 'Complete your profile', sub: 'Add a photo and bio to your account.', done: false },
              { label: 'Start learning', sub: 'Access course materials and begin studying.', done: false },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
        {/* Courses & Milestones */}
        <div className="lg:col-span-2 space-y-3">
          {/* Courses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-700">Your Courses</h2>
              <Link href="/courses" className="text-[11px] text-primary-600 hover:underline font-medium flex items-center gap-0.5">View all <ArrowRight size={11} /></Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
            ) : !isNewUser ? (
              <div className="space-y-2">
                {courses.slice(0, 4).map((course) => (
                  <div key={course._id} className="group flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                        <BookOpen size={14} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">{course.title}</p>
                        <p className="text-[11px] text-slate-400">{course.code} • {course.progress || 0}% complete</p>
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

          {/* Upcoming Milestones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-700">Upcoming Deadlines</h2>
              <Link href="/courses" className="text-[11px] text-primary-600 hover:underline font-medium flex items-center gap-0.5">View all <ArrowRight size={11} /></Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
            ) : milestones.length > 0 ? (
              <div className="space-y-2">
                {milestones.slice(0, 3).map((milestone, idx) => {
                  const daysUntil = Math.ceil((new Date(milestone.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isOverdue = daysUntil < 0;
                  const isUrgent = daysUntil <= 3 && daysUntil >= 0;

                  return (
                    <div key={milestone._id || idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isOverdue ? 'bg-rose-50 border-rose-100' : isUrgent ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? 'bg-rose-500' : isUrgent ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] font-medium truncate ${isOverdue ? 'text-rose-900' : isUrgent ? 'text-amber-900' : 'text-slate-800'}`}>{milestone.title}</p>
                        <p className={`text-[10px] ${isOverdue ? 'text-rose-600' : isUrgent ? 'text-amber-600' : 'text-slate-400'}`}>
                          {isOverdue ? `Overdue by ${Math.abs(daysUntil)} days` : isUrgent ? `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}` : new Date(milestone.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${milestone.type === 'assignment' ? 'bg-blue-100 text-blue-700' : milestone.type === 'quiz' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {milestone.type === 'assignment' ? 'Assignment' : milestone.type === 'quiz' ? 'Quiz' : 'Session'}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center bg-white border border-slate-100 rounded-xl">
                <CheckCircle2 size={20} className="text-emerald-200 mb-2" />
                <p className="text-[12px] text-slate-400">No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* AI Tutor Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
            <div className="flex items-center gap-1.5 text-primary-400 text-[11px] font-semibold uppercase tracking-wider mb-3">
              <Sparkles size={12} />AI Tutor
            </div>
            <p className="text-slate-300 text-[12px] mb-3">Need help with your studies?</p>
            <div className="space-y-1.5 mb-3">
              {['Get homework help', 'Explain concepts', 'Practice problems'].map(s => (
                <button key={s} className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-[12px] transition-colors">
                  {s} <ArrowRight size={11} className="text-slate-500" />
                </button>
              ))}
            </div>
            <button onClick={() => router.push('/ai-tutor')} className="w-full bg-primary-600 hover:bg-primary-500 text-white text-[12px] font-semibold py-2 rounded-lg transition-colors">
              Launch AI Tutor
            </button>
          </div>

          {/* Study Streak */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 section-label mb-3">
              <Zap size={12} className="text-amber-500" />Study Streak
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-slate-900 mb-1">{stats.studyHours || 0}</p>
              <p className="text-[11px] text-slate-400 mb-3">hours this week</p>
              <div className="flex gap-1 justify-center mb-3">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                  <div key={day} className={`w-6 h-6 rounded-md text-[9px] font-bold flex items-center justify-center ${i < 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">Keep up the momentum!</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 section-label mb-3">
              <Bell size={12} />Recent Activity
            </div>
            <div className="space-y-2.5">
              {[
                { dot: 'bg-emerald-500', label: 'Assignment submitted', sub: 'Data Structures' },
                { dot: 'bg-primary-500', label: 'Quiz completed', sub: '85% score' },
                { dot: 'bg-amber-500', label: 'New announcement', sub: 'From instructor' },
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
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, trendUp, color }: {
  icon: React.ReactNode,
  label: string,
  value: string | number,
  trend: string,
  trendUp: boolean,
  color: 'blue' | 'emerald' | 'violet' | 'indigo'
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    violet: 'text-violet-600 bg-violet-50',
    indigo: 'text-indigo-600 bg-indigo-50',
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
