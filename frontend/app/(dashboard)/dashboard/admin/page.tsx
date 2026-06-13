'use client';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useAdminStats, useAdminAnalytics } from '@/hooks/queries/useAdmin';
import {
  Calendar, Plus, Users, BookOpen, GraduationCap, TrendingUp, ArrowRight,
  Activity, AlertCircle, BarChart3, Settings, Zap, Bell, ArrowUpRight,
  ArrowDownRight, Loader2, CheckCircle2
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStats(Boolean(user));
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics(Boolean(user));

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const isLoading = statsLoading || analyticsLoading;

  const statCards: Array<{
    label: string;
    value: number | string;
    icon: React.ComponentType<any>;
    color: 'blue' | 'emerald' | 'violet' | 'indigo';
    trend: string;
    trendUp: boolean;
  }> = [
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: Users,
      color: 'blue',
      trend: '+12% this month',
      trendUp: true,
    },
    {
      label: 'Active Teachers',
      value: stats?.totalTeachers ?? 0,
      icon: GraduationCap,
      color: 'emerald',
      trend: '+2 new',
      trendUp: true,
    },
    {
      label: 'Total Courses',
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      color: 'violet',
      trend: '+5 this term',
      trendUp: true,
    },
    {
      label: 'Platform Health',
      value: '98%',
      icon: Activity,
      color: 'indigo',
      trend: 'Optimal',
      trendUp: true,
    },
  ];

  const quickActions = [
    { label: 'Add Student', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', href: '/admin/users' },
    { label: 'Add Teacher', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', href: '/admin/users' },
    { label: 'Create Course', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100', href: '/admin/courses/new' },
    { label: 'View Logs', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', href: '/admin/logs' },
  ];

  const managementTools = [
    { href: '/admin/users', label: 'User Management', icon: Users, sub: 'Manage students & teachers', count: stats?.totalStudents },
    { href: '/admin/courses', label: 'Course Management', icon: BookOpen, sub: 'View and edit all courses', count: stats?.totalCourses },
    { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp, sub: 'Platform performance data', count: null },
    { href: '/admin/logs', label: 'System Logs', icon: Activity, sub: 'Monitor system activity', count: null },
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
              Platform overview and system management
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button className="btn btn-secondary h-10 px-4 gap-2 text-xs font-bold rounded-xl">
              <Settings size={14} />
              Settings
            </button>
            <Link href="/admin/users" className="btn btn-primary h-10 px-4 gap-2 text-xs font-bold rounded-xl">
              <Plus size={14} />
              Add User
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickActions.map(({ label, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className={`flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all text-left group`}
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center transition-colors shrink-0`}>
              <Icon size={15} className={color} />
            </div>
            <span className="text-[12px] font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
          </Link>
        ))}
      </div>

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
            loading={isLoading}
          />
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column - Management & Overview */}
        <div className="lg:col-span-2 space-y-3">
          {/* Management Tools */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-slate-700">Management Tools</h2>
              <Link href="/admin/users" className="text-[11px] text-primary-600 hover:underline font-medium flex items-center gap-0.5">View all <ArrowRight size={11} /></Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {managementTools.map(({ href, label, icon: Icon, sub, count }) => (
                <Link key={href} href={href}
                  className="flex items-start gap-3 p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-200 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary-50 transition-colors">
                    <Icon size={16} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                    {count !== null && <p className="text-[12px] font-bold text-primary-600 mt-1">{count?.toLocaleString()} total</p>}
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-600 transition-colors shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold text-slate-700">System Status</h2>
              <span className="px-2 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">All Systems Operational</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Database', status: 'healthy', uptime: '99.9%' },
                { label: 'API Server', status: 'healthy', uptime: '99.8%' },
                { label: 'Storage', status: 'healthy', uptime: '100%' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-medium text-slate-800">{item.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.uptime}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* System Control Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
            <div className="flex items-center gap-1.5 text-primary-400 text-[11px] font-semibold uppercase tracking-wider mb-3">
              <Zap size={12} />Control Panel
            </div>
            <p className="text-slate-300 text-[12px] mb-3">Quick system actions</p>
            <div className="space-y-1.5">
              {[
                { label: 'System Settings', icon: Settings },
                { label: 'Backup Database', icon: Activity },
                { label: 'View Audit Logs', icon: BarChart3 },
              ].map(({ label, icon: Icon }) => (
                <button key={label} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-[12px] transition-colors group">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-slate-400 group-hover:text-primary-400 transition-colors" />
                    {label}
                  </div>
                  <ArrowRight size={11} className="text-slate-500 group-hover:text-primary-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 section-label mb-4">
              <TrendingUp size={12} className="text-primary-500" />Key Metrics
            </div>
            <div className="space-y-3">
              {[
                { label: 'Avg. Course Size', value: '24 students', trend: '+3 this month' },
                { label: 'Completion Rate', value: '87%', trend: '+5% this term' },
                { label: 'Active Sessions', value: '156', trend: 'Right now' },
              ].map((metric, i) => (
                <div key={i} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-widest">{metric.label}</p>
                  <p className="text-[14px] font-bold text-slate-900 mt-1">{metric.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{metric.trend}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 section-label mb-3">
              <Bell size={12} />Alerts
            </div>
            <div className="space-y-2">
              {[
                { type: 'info', label: 'Scheduled maintenance', time: 'Tonight 2 AM' },
                { type: 'warning', label: 'High memory usage', time: '5 min ago' },
              ].map((alert, i) => (
                <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${alert.type === 'warning' ? 'bg-amber-50 border border-amber-100' : 'bg-blue-50 border border-blue-100'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-medium ${alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>{alert.label}</p>
                    <p className={`text-[10px] ${alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>{alert.time}</p>
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

function StatCard({ icon, label, value, trend, trendUp, color, loading }: {
  icon: React.ReactNode,
  label: string,
  value: number | string,
  trend: string,
  trendUp: boolean,
  color: 'blue' | 'emerald' | 'violet' | 'indigo',
  loading: boolean,
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
        {loading ? (
          <div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
        ) : (
          <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{typeof value === 'number' ? value.toLocaleString() : value}</h4>
        )}
      </div>
    </div>
  );
}
