'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/utils/api/adminApi';
import { 
  ChevronRight, Search, Plus, Bell
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  [key: string]: number | undefined;
}

export default function AdminDashboard() {
  const { user, logout }    = useAuth();
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(res => setStats(res.data.data))
      .catch(() => setStats({ totalUsers:0, totalStudents:0, totalTeachers:0, totalCourses:0, activeCourses:0, totalEnrollments:0 }))
      .finally(() => setLoading(false));
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const statDefs = [
    { key:'totalUsers',       label:'Total Users',       icon:Users, color:'text-blue-600', bg:'bg-blue-50', border:'border-blue-100', href:'/admin/users' },
    { key:'totalStudents',    label:'Students',          icon:GraduationCap, color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-100', href:'/admin/users?role=student' },
    { key:'totalTeachers',    label:'Teachers',          icon:UserIcon, color:'text-purple-600', bg:'bg-purple-50', border:'border-purple-100', href:'/admin/users?role=teacher' },
    { key:'totalCourses',     label:'Total Courses',     icon:BookOpen, color:'text-indigo-600', bg:'bg-indigo-50', border:'border-indigo-100', href:'/admin/courses' },
    { key:'activeCourses',    label:'Active Courses',    icon:Activity, color:'text-teal-600', bg:'bg-teal-50', border:'border-teal-100', href:'/admin/courses?status=active' },
    { key:'totalEnrollments', label:'Total Enrollments', icon:BarChart3, color:'text-amber-600', bg:'bg-amber-50', border:'border-amber-100', href:'/admin/analytics' },
  ];

  const quickActions = [
    { href:'/admin/users',     label:'Manage Users',    icon:Users, color:'text-blue-600', bg:'bg-blue-50', desc:'View, suspend, change roles, delete users' },
    { href:'/admin/courses',   label:'Manage Courses',  icon:BookOpen, color:'text-emerald-600', bg:'bg-emerald-50', desc:'Reassign teachers, archive courses' },
    { href:'/admin/analytics', label:'Analytics',       icon:BarChart3, color:'text-purple-600', bg:'bg-purple-50', desc:'Platform-wide performance & grade stats' },
    { href:'/admin/logs',      label:'Activity Logs',   icon:Activity, color:'text-amber-600', bg:'bg-amber-50', desc:'Full audit trail of all admin actions' },
  ];

  return (
    <div className="relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar size={14} />
                <span>{currentDate}</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                {greeting}, {user?.name?.split(' ')[0]} 👋
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-500 text-lg max-w-xl leading-relaxed font-medium">
                Platform overview and management tools. System status is <strong className="text-emerald-600 font-bold">100% Operational</strong>.
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="flex gap-4"
            >
              <Link href="/admin/users" className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all hover:-translate-y-0.5">
                <Plus size={18} />
                Register User
              </Link>
              <Link href="/admin/analytics" className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
                <BarChart3 size={18} />
                View Analytics
              </Link>
            </motion.div>
          </header>

          {/* Stats Grid */}
          <h2 className="text-lg font-extrabold text-slate-900 mb-6">Platform Overview</h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-32 rounded-[24px] bg-slate-100 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {statDefs.map((stat, i) => (
                <motion.div 
                  key={stat.key} 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                >
                  <Link href={stat.href} className="group block relative overflow-hidden rounded-[24px] bg-white border border-slate-200 p-6 hover:border-blue-300 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                        <stat.icon size={24} className={stat.color} />
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                        {stats?.[stat.key]?.toLocaleString() ?? '—'}
                      </h3>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-extrabold text-slate-900">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
            {quickActions.map((action, i) => (
              <motion.div 
                key={action.href} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              >
                <Link href={action.href} className="group block h-full rounded-[24px] bg-white border border-slate-200 p-6 hover:border-slate-300 transition-all shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl ${action.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                    <action.icon size={20} className={action.color} />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mb-2">{action.label}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{action.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Footer Note */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center gap-6 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Shield size={24} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-base font-extrabold text-slate-900 mb-1">Full Administrative Access</p>
              <p className="text-sm text-slate-500 font-medium">All actions performed on this dashboard are logged to the enterprise activity audit trail.</p>
            </div>
            <Link href="/admin/logs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition-colors whitespace-nowrap">
              View Audit Trail <ChevronRight size={16} />
            </Link>
          </motion.div>

      </div>
    </div>
  );
}
