'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const dynamic = 'force-dynamic';
import { useAuth } from '@/context/AuthContext';
import { teacherApi } from '@/utils/api/teacherApi';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  BarChart3, TrendingUp, Users, AlertTriangle, ArrowRight,
  Download, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  const { data: courses = [] } = useQuery({
    queryKey: queryKeys.teacher.courses(user?._id || ''),
    queryFn: () => teacherApi.getMyCourses(),
    select: (res) => res.data?.data ?? [],
    enabled: !!user,
  });

  const { data: analytics = null, isLoading } = useQuery({
    queryKey: ['teacher', 'analytics', selectedCourse],
    queryFn: () => selectedCourse ? teacherApi.getCourseAnalytics(selectedCourse) : null,
    select: (res) => res?.data?.data ?? null,
    enabled: !!selectedCourse,
  });

  const { data: atRiskStudents = [] } = useQuery({
    queryKey: ['teacher', 'at-risk', selectedCourse],
    queryFn: () => selectedCourse ? teacherApi.getAtRiskStudents(selectedCourse) : null,
    select: (res) => res?.data?.data ?? [],
    enabled: !!selectedCourse,
  });

  const gradeDistribution = analytics ? [
    { name: 'Below 50', value: analytics.distribution?.below50 || 0, fill: '#ef4444' },
    { name: '50-69',    value: analytics.distribution?.['50-69'] || 0, fill: '#f97316' },
    { name: '70-89',    value: analytics.distribution?.['70-89'] || 0, fill: '#eab308' },
    { name: '90-100',   value: analytics.distribution?.['90-100'] || 0, fill: '#22c55e' },
  ] : [];

  const performanceTrend = [
    { week: 'Week 1', avg: 65 },
    { week: 'Week 2', avg: 68 },
    { week: 'Week 3', avg: 72 },
    { week: 'Week 4', avg: 75 },
    { week: 'Week 5', avg: 78 },
    { week: 'Week 6', avg: 80 },
  ];

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Analytics</h1>
          <p className="text-slate-500 mt-1">Track course performance and student progress</p>
        </div>
        <button className="btn btn-secondary gap-2 self-start sm:self-auto">
          <Download size={16} />
          Export Report
        </button>
      </header>

      {/* Course Selector */}
      <div className="flex gap-3">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="input-premium flex-1"
        >
          <option value="">Select a course...</option>
          {courses.map((course: any) => (
            <option key={course._id} value={course._id}>
              {course.title} ({course.code})
            </option>
          ))}
        </select>
        <button className="btn btn-secondary gap-2">
          <RefreshCw size={16} />
        </button>
      </div>

      {!selectedCourse ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl">
          <BarChart3 size={40} className="mx-auto text-slate-200 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">Select a course</h3>
          <p className="text-slate-500">Choose a course to view detailed analytics</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Class Average',   value: `${analytics?.classAverage || 0}%`,    icon: TrendingUp,   color: 'blue' },
              { label: 'Highest Score',   value: `${analytics?.highestScore || 0}%`,    icon: TrendingUp,   color: 'emerald' },
              { label: 'Lowest Score',    value: `${analytics?.lowestScore || 0}%`,     icon: AlertTriangle,color: 'amber' },
              { label: 'Completion Rate', value: `${analytics?.completionRate || 0}%`,  icon: Users,        color: 'violet' },
            ].map(({ label, value, icon: Icon, color }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 ${
                  color === 'blue'    ? 'bg-blue-50 border-blue-100' :
                  color === 'emerald' ? 'bg-emerald-50 border-emerald-100' :
                  color === 'amber'   ? 'bg-amber-50 border-amber-100' :
                  'bg-violet-50 border-violet-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${
                      color === 'blue'    ? 'text-blue-600' :
                      color === 'emerald' ? 'text-emerald-600' :
                      color === 'amber'   ? 'text-amber-600' :
                      'text-violet-600'
                    }`}>{label}</p>
                    <p className="text-2xl font-black mt-1">{value}</p>
                  </div>
                  <Icon size={24} className={
                    color === 'blue'    ? 'text-blue-200' :
                    color === 'emerald' ? 'text-emerald-200' :
                    color === 'amber'   ? 'text-amber-200' :
                    'text-violet-200'
                  } />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Grade Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={gradeDistribution} cx="50%" cy="50%" labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80} dataKey="value">
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* At-Risk Students */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">At-Risk Students</h3>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                {atRiskStudents.length} students
              </span>
            </div>

            {atRiskStudents.length === 0 ? (
              <div className="py-8 text-center">
                <TrendingUp size={32} className="mx-auto text-emerald-200 mb-3" />
                <p className="text-sm text-slate-500">All students are performing well!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {atRiskStudents.map((student: any, idx: number) => (
                  <motion.div key={student._id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{student.student?.name}</p>
                      <p className="text-xs text-slate-500">{student.student?.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">{student.percentage}%</p>
                        <p className="text-xs text-slate-500">{student.grade}</p>
                      </div>
                      <Link href={`/teacher/students/${student.student?._id}`} className="btn btn-secondary btn-sm gap-1">
                        Help <ArrowRight size={12} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
