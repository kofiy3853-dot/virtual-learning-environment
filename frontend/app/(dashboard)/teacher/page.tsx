'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { teacherApi } from '@/utils/api/teacherApi';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  BookOpen, Users, AlertTriangle, Clock, TrendingUp,
  ArrowRight, CheckCircle2, AlertCircle, Loader2,
  BarChart3, FileText, Zap, Calendar, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeacherPortal() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  // Fetch all teacher data
  const { data: stats = { students: 0, attendance: 0, engagementData: [], upcomingClasses: [] } } = useQuery({
    queryKey: ['teacher', 'stats'],
    queryFn: () => teacherApi.getStats(),
    select: (res) => res.data?.data ?? { students: 0, attendance: 0, engagementData: [], upcomingClasses: [] },
    enabled: !!user,
  });

  const { data: courses = [] } = useQuery({
    queryKey: queryKeys.teacher.courses(user?._id || ''),
    queryFn: () => teacherApi.getMyCourses(),
    select: (res) => res.data?.data ?? [],
    enabled: !!user,
  });

  const { data: pendingSubmissions = [] } = useQuery({
    queryKey: ['teacher', 'pending-submissions'],
    queryFn: () => teacherApi.getPendingSubmissions(),
    select: (res) => res.data?.data ?? [],
    enabled: !!user,
  });

  const pendingCount = pendingSubmissions.length;
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const quickStats = [
    {
      label: 'Active Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'blue',
      href: '/teacher/courses',
    },
    {
      label: 'Total Students',
      value: stats.students,
      icon: Users,
      color: 'emerald',
      href: '/teacher/courses',
    },
    {
      label: 'Pending Submissions',
      value: pendingCount,
      icon: AlertTriangle,
      color: pendingCount > 0 ? 'amber' : 'slate',
      href: '/teacher/submissions',
    },
    {
      label: 'Avg Attendance',
      value: `${stats.attendance}%`,
      icon: TrendingUp,
      color: stats.attendance >= 80 ? 'emerald' : 'amber',
      href: '/teacher/attendance',
    },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-400 border-slate-100',
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {courses.length === 0
              ? 'Create your first course to get started'
              : `Managing ${courses.length} course${courses.length !== 1 ? 's' : ''} with ${stats.students} student${stats.students !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/courses/new" className="btn btn-primary gap-2 self-start sm:self-auto">
          <BookOpen size={16} />
          Create Course
        </Link>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`group relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-md hover:border-opacity-100 cursor-pointer ${colorMap[stat.color]}`}
              onClick={() => {
                if (stat.href) window.location.href = stat.href;
              }}
            >
              <div className="absolute -top-8 -right-8 w-20 h-20 opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform" style={{ backgroundColor: 'currentColor' }} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-black mt-2 tracking-tighter">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-60">
                View details <ArrowRight size={12} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Courses & Submissions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Courses Section */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Your Courses</h2>
                <p className="text-xs text-slate-500 mt-0.5">{courses.length} active course{courses.length !== 1 ? 's' : ''}</p>
              </div>
              <Link href="/teacher/courses" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="py-8 text-center">
                <BookOpen size={32} className="mx-auto text-slate-200 mb-3" />
                <p className="text-sm text-slate-500 mb-3">No courses yet</p>
                <Link href="/courses/new" className="btn btn-primary btn-sm">
                  Create Your First Course
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.slice(0, 5).map((course: any) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary-200 transition-colors">
                        <BookOpen size={16} className="text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                          {course.title}
                        </p>
                        <p className="text-xs text-slate-500">{course.code}</p>
                      </div>
                    </div>
                    <Link
                      href={`/courses/${course._id}`}
                      className="btn btn-secondary btn-sm gap-1 shrink-0"
                    >
                      Open <ArrowRight size={12} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Submissions */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Pending Submissions</h2>
                <p className="text-xs text-slate-500 mt-0.5">{pendingCount} awaiting grading</p>
              </div>
              <Link href="/teacher/submissions" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {pendingCount === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-200 mb-3" />
                <p className="text-sm text-slate-500">All submissions graded!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingSubmissions.slice(0, 5).map((submission: any, idx: number) => (
                  <motion.div
                    key={submission._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100 hover:border-amber-200 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {submission.assignment?.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {submission.student?.name} • {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button className="btn btn-secondary btn-sm gap-1 shrink-0">
                      Grade <ArrowRight size={12} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Analytics */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'View Analytics', icon: BarChart3, href: '/teacher/analytics' },
                { label: 'My Courses', icon: BookOpen, href: '/teacher/courses' },
                { label: 'Submissions', icon: FileText, href: '/teacher/submissions' },
              ].map(({ label, icon: Icon, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <Icon size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
                  <ArrowRight size={12} className="ml-auto text-slate-300 group-hover:text-slate-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Engagement Chart */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Weekly Engagement</h3>
            <div className="flex items-end justify-between gap-1 h-24">
              {stats.engagementData?.map((value: number, idx: number) => (
                <div
                  key={idx}
                  className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md hover:from-primary-600 hover:to-primary-500 transition-colors cursor-pointer group relative"
                  style={{ height: `${(value / 100) * 100}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {value}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>

          {/* At-Risk Alert */}
          {pendingCount > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Action Needed</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {pendingCount} submission{pendingCount !== 1 ? 's' : ''} waiting for grading
                  </p>
                  <Link href="/teacher/submissions" className="text-xs font-semibold text-amber-600 hover:text-amber-700 mt-2 inline-flex items-center gap-1">
                    Review now <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
