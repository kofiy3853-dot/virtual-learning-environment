'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { AxiosError } from 'axios';
import { 
  LayoutDashboard, BookOpen, MessageSquare, Bell, User as UserIcon, 
  LogOut, Plus, Sparkles, TrendingUp, Users, Clock, Calendar, 
  ArrowRight, Wand2, PenTool, CheckCircle2, ChevronRight, Activity, X, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Course {
  _id: string;
  code: string;
  title: string;
  status: string;
  semester: string;
  academicYear: string;
  teacher?: { _id: string } | string;
  studentCount?: number;
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title:'', code:'', description:'', semester:'Semester 1', academicYear:'2025/2026' });

  useEffect(() => {
    courseApi.getAll()
      .then(res => {
        const all = res.data.data || [];
        setCourses(all.filter((c: Course) => {
          if (!c.teacher) return false;
          if (typeof c.teacher === 'object') return c.teacher._id === user?._id;
          return c.teacher === user?._id;
        }));
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.code) { toast.error('Title and code are required.'); return; }
    setCreating(true);
    try {
      const res = await courseApi.create(form);
      setCourses(p => [res.data.data, ...p]);
      setShowForm(false);
      setForm({ title:'', code:'', description:'', semester:'Semester 1', academicYear:'2025/2026' });
      toast.success('Course created successfully!');
    } catch (e: unknown) {
      const err = e as AxiosError<{message: string}>;
      toast.error(err.response?.data?.message || 'Failed to create course.');
    } finally { setCreating(false); }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-surface-950 text-surface-50 flex overflow-hidden font-sans relative">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary-900/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] bg-emerald-900/5 rounded-full blur-[100px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-surface-950/50 backdrop-blur-2xl flex flex-col z-20 relative">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <div className="w-4 h-4 bg-primary-500 rounded-sm" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">UniLearn</span>
          </div>
        </div>

        <div className="px-4 py-8 flex-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-surface-600 mb-4">Workspace</p>
          <nav className="flex flex-col gap-1.5">
            <Link href="/dashboard/teacher" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary-500/10 text-primary-400 font-semibold border border-primary-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)] transition-all">
              <LayoutDashboard size={18} />
              <span className="text-sm">Dashboard</span>
            </Link>
            <Link href="/courses" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-400 font-medium hover:bg-white/5 hover:text-white transition-all group">
              <BookOpen size={18} className="group-hover:text-primary-400 transition-colors" />
              <span className="text-sm">My Courses</span>
            </Link>
            <Link href="/messages" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-surface-400 font-medium hover:bg-white/5 hover:text-white transition-all group">
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="group-hover:text-primary-400 transition-colors" />
                <span className="text-sm">Messages</span>
              </div>
              <span className="bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]">3</span>
            </Link>
            <Link href="/notifications" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-400 font-medium hover:bg-white/5 hover:text-white transition-all group">
              <Bell size={18} className="group-hover:text-primary-400 transition-colors" />
              <span className="text-sm">Notifications</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 mt-auto border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5 mb-4 hover:bg-white/[0.05] transition-colors cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-indigo-800 flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all">
              {user?.name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Teacher'}</p>
              <p className="text-[10px] font-medium text-surface-400 truncate capitalize">{user?.department || 'Faculty'}</p>
            </div>
          </div>
          
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/80 font-medium hover:bg-red-500/10 hover:text-red-400 transition-all w-full text-left">
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
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar size={14} />
                <span>{currentDate}</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
                Welcome back, {user?.name?.split(' ')[0]} 👋
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-surface-400 text-lg max-w-xl leading-relaxed">
                You have <strong className="text-white font-semibold">12 student submissions</strong> to review and <strong className="text-white font-semibold">2 upcoming classes</strong> today.
              </motion.p>
            </div>
            
            <motion.button 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-surface-950 font-bold hover:bg-surface-200 shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              New Course
            </motion.button>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Total Courses', value: courses.length, icon: BookOpen, trend: '+2 this month', trendUp: true, color: 'text-primary-400', bg: 'bg-primary-500/10', border: 'border-primary-500/20' },
              { label: 'Active Students', value: 142, icon: Users, trend: '+12% engagement', trendUp: true, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: 'Avg. Attendance', value: '89%', icon: Activity, trend: '-2% vs last week', trendUp: false, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="relative overflow-hidden rounded-3xl glass-dark border border-white/5 p-6 group hover:border-white/10 transition-colors shadow-lg"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bg} rounded-full blur-[50px] -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity duration-700`} />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center shadow-inner`}>
                      <stat.icon size={22} className={stat.color} />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${stat.trendUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">{loading ? '-' : stat.value}</h3>
                  <p className="text-sm font-medium text-surface-400">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content Area (Courses) */}
            <div className="xl:col-span-2 space-y-8">
              
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Active Workspace <Sparkles size={18} className="text-primary-400" />
                </h2>
                <Link href="/courses" className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1 group">
                  View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-28 rounded-3xl bg-white/5 animate-pulse border border-white/5" />)}
                </div>
              ) : courses.length === 0 ? (
                /* Premium Empty State */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[32px] glass-dark border border-white/5 p-12 text-center relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px]" />
                  
                  <div className="relative z-10">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500/20 to-indigo-500/10 rounded-3xl border border-primary-500/20 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                      <Wand2 size={40} className="text-primary-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">Start building your workspace</h3>
                    <p className="text-surface-400 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
                      Create your first course to unlock analytics, assignments, and student engagement tools. Our AI assistant is ready to help you generate curriculum outlines.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                      <button onClick={() => setShowForm(true)} className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white text-surface-950 font-bold hover:bg-surface-200 transition-colors shadow-lg shadow-white/5">
                        <PenTool size={20} className="group-hover:rotate-12 transition-transform" /> Create Manually
                      </button>
                      <button className="group flex items-center justify-center gap-3 px-6 py-4 rounded-2xl glass border border-white/10 text-white font-bold hover:bg-white/10 transition-colors shadow-lg">
                        <Sparkles size={20} className="text-amber-400 group-hover:animate-pulse" /> Generate with AI
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  {courses.slice(0, 4).map((course, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      key={course._id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl glass-dark border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-primary-900/5"
                    >
                      <div className="flex items-center gap-5 mb-5 sm:mb-0">
                        <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0 group-hover:bg-primary-500/20 transition-colors">
                          <BookOpen size={24} className="text-primary-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-lg font-bold text-white group-hover:text-primary-300 transition-colors">{course.title}</h3>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                              course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>{course.status}</span>
                          </div>
                          <p className="text-sm text-surface-400 font-medium flex items-center gap-2">
                            <span className="text-surface-300">{course.code}</span> • {course.semester} {course.academicYear}
                          </p>
                        </div>
                      </div>
                      
                      <Link href={`/courses/${course._id}`} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white text-sm font-bold transition-all shrink-0 hover:-translate-y-0.5">
                        Manage <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-6">
              
              {/* Productivity Widget */}
              <div className="rounded-3xl glass-dark border border-white/5 p-7 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-[40px] -mr-10 -mt-10" />
                <h3 className="text-xs font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary-400" /> Student Engagement
                </h3>
                
                {/* Custom CSS Sparkline Bar Chart */}
                <div className="flex items-end justify-between gap-2 h-32 mb-4">
                  {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                    <div key={i} className="w-full bg-white/5 rounded-t-md relative group h-full flex items-end overflow-hidden">
                      <div className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-md transition-all duration-700 group-hover:opacity-80" style={{ height: `${h}%` }} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {h}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs font-bold text-surface-500 uppercase tracking-wider">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>

              {/* Upcoming Classes Widget */}
              <div className="rounded-3xl glass-dark border border-white/5 p-7 shadow-lg">
                <h3 className="text-xs font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" /> Upcoming Schedule
                </h3>
                <div className="space-y-5">
                  {[
                    { title: 'CS101 Intro Lecture', time: '10:00 AM', type: 'Live Class', color: 'bg-primary-500' },
                    { title: 'Project Proposals Due', time: '11:59 PM', type: 'Assignment', color: 'bg-amber-500' },
                    { title: 'Faculty Meeting', time: 'Tomorrow', type: 'Event', color: 'bg-emerald-500' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color} mt-1.5 shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                      <div>
                        <p className="text-sm font-bold text-white mb-1">{item.title}</p>
                        <p className="text-xs font-medium text-surface-400">{item.time} <span className="mx-1">•</span> {item.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-bold text-white uppercase tracking-widest transition-colors">
                  View Full Calendar
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Creation Modal Overlay */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-surface-950/80 backdrop-blur-md" onClick={() => setShowForm(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-surface-900 border border-white/10 rounded-[32px] shadow-2xl p-8 sm:p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Workspace</h2>
                  <p className="text-surface-400 text-sm">Configure your new course environment.</p>
                </div>
                <button onClick={() => setShowForm(false)} aria-label="Close" title="Close" className="p-3 bg-white/5 text-surface-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Course Title</label>
                    <input required placeholder="e.g. Advanced AI" className="w-full bg-surface-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none text-sm font-medium" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Course Code</label>
                    <input required placeholder="e.g. CS401" className="w-full bg-surface-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none text-sm font-medium" value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value}))} />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2.5">
                    <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea rows={3} placeholder="What will students learn in this workspace?" className="w-full bg-surface-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none resize-none text-sm font-medium" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Semester</label>
                    <select className="w-full bg-surface-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-primary-500 transition-all outline-none appearance-none text-sm font-medium" value={form.semester} onChange={e => setForm(p=>({...p,semester:e.target.value}))}>
                      <option>Semester 1</option>
                      <option>Semester 2</option>
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Academic Year</label>
                    <input placeholder="e.g. 2025/2026" className="w-full bg-surface-950 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-primary-500 transition-all outline-none text-sm font-medium" value={form.academicYear} onChange={e => setForm(p=>({...p,academicYear:e.target.value}))} />
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-white/5 flex gap-4 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3.5 rounded-2xl text-sm font-bold text-surface-300 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating} className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-surface-950 text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all">
                    {creating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {creating ? 'Initializing...' : 'Create Workspace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
