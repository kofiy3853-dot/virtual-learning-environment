'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { 
  LayoutDashboard, BookOpen, MessageSquare, Bell, User as UserIcon, 
  LogOut, GraduationCap, Calendar, Clock, ChevronRight, Activity, 
  Sparkles, TrendingUp, CheckCircle2, AlertCircle
} from 'lucide-react';

interface Course {
  _id: string;
  code: string;
  title: string;
  status: string;
  semester: string;
  academicYear: string;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseApi.getMyCourses()
      .then(res => setCourses(res.data.data || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const activeCourses = courses.filter(c => c.status === 'active');
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white/80 backdrop-blur-xl flex flex-col z-20 relative shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">UniLearn</span>
          </div>
        </div>

        <div className="px-4 py-8 flex-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Workspace</p>
          <nav className="flex flex-col gap-1.5">
            <Link href="/dashboard/student" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-100 transition-all">
              <LayoutDashboard size={18} />
              <span className="text-sm">Dashboard</span>
            </Link>
            <Link href="/courses" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all group">
              <BookOpen size={18} className="group-hover:text-blue-600 transition-colors" />
              <span className="text-sm">My Courses</span>
            </Link>
            <Link href="/messages" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all group">
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="group-hover:text-blue-600 transition-colors" />
                <span className="text-sm">Messages</span>
              </div>
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">1</span>
            </Link>
            <Link href="/notifications" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all group">
              <Bell size={18} className="group-hover:text-blue-600 transition-colors" />
              <span className="text-sm">Notifications</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all group">
              <UserIcon size={18} className="group-hover:text-blue-600 transition-colors" />
              <span className="text-sm">Profile</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 mt-auto border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-slate-200 mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              {user?.name?.charAt(0) || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Student'}</p>
              <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-wider">{user?.role || 'Student'}</p>
            </div>
          </div>
          
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 font-bold hover:bg-red-50 hover:text-red-700 transition-all w-full text-left">
            <LogOut size={18} />
            <span className="text-sm">Sign out securely</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
        <div className="max-w-[1400px] mx-auto p-8 lg:p-12">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar size={14} />
                <span>{currentDate}</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                {greeting}, {user?.name?.split(' ')[0]} 👋
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-500 text-lg max-w-xl leading-relaxed font-medium">
                You have <strong className="text-slate-900 font-bold">2 assignments due soon</strong> and <strong className="text-slate-900 font-bold">1 upcoming lecture</strong> today.
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            >
              <Link href="/courses" className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
                <BookOpen size={18} />
                Browse Catalog
              </Link>
            </motion.div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Enrolled Courses', value: courses.length, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
              { label: 'Active Courses', value: activeCourses.length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Department', value: user?.department || 'N/A', icon: GraduationCap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="relative overflow-hidden rounded-[24px] bg-white border border-slate-200 p-6 group hover:border-slate-300 transition-colors shadow-sm hover:shadow-xl hover:shadow-slate-200/50"
              >
                <div className="relative z-10 flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon size={24} className={stat.color} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">{loading ? '-' : stat.value}</h3>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content Area (Courses) */}
            <div className="xl:col-span-2 space-y-8">
              
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  My Learning Workspace <Sparkles size={18} className="text-blue-600" />
                </h2>
                <Link href="/courses" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 group">
                  View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-[24px] bg-slate-100 animate-pulse border border-slate-200" />)}
                </div>
              ) : courses.length === 0 ? (
                /* Premium Empty State */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[32px] bg-white border border-slate-200 p-12 text-center shadow-sm"
                >
                  <div className="w-24 h-24 mx-auto bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-center mb-8 shadow-sm">
                    <BookOpen size={40} className="text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">No courses enrolled yet</h3>
                  <p className="text-slate-500 text-lg max-w-md mx-auto mb-8 font-medium">
                    Browse the catalog and enroll in courses to start your academic journey.
                  </p>
                  <Link href="/courses" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
                    Browse Catalog
                  </Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {courses.map((course, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      key={course._id} 
                    >
                      <Link href={`/courses/${course._id}`} className="group block p-6 rounded-[24px] bg-white border border-slate-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-xl hover:shadow-blue-900/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex items-start justify-between mb-4">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                            {course.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                            course.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>{course.status}</span>
                        </div>
                        
                        <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight pr-4">
                          {course.title}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                          {course.semester} • {course.academicYear}
                        </p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-6">
              
              {/* Productivity Widget */}
              <div className="rounded-[24px] bg-white border border-slate-200 p-7 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-blue-600" /> Academic Progress
                </h3>
                
                <div className="space-y-5">
                  {[
                    { label: 'Overall Completion', val: 68, color: 'bg-blue-600' },
                    { label: 'Assignments Submitted', val: 85, color: 'bg-emerald-500' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>{item.label}</span>
                        <span>{item.val}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reminders Widget */}
              <div className="rounded-[24px] bg-white border border-slate-200 p-7 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-500" /> Action Required
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-1">Advanced AI Midterm</p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> Due in 2 days
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 mb-1">Database Project Proposal</p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> Due this Friday
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
