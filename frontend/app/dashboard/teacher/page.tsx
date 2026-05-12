'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { teacherApi } from '@/utils/api/teacherApi';
import { AxiosError } from 'axios';
import Sidebar from '@/components/shared/Sidebar';
import { 
  BookOpen, Plus, Sparkles, TrendingUp, Users, Clock, Calendar, 
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
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title:'', code:'', description:'', semester:'Semester 1', academicYear:'2025/2026' });

  const [stats, setStats] = useState({ students: 0, attendance: 0, engagementData: [0,0,0,0,0,0,0], upcomingClasses: [] as any[] });

  useEffect(() => {
    teacherApi.getStats()
      .then(res => setStats(res.data.data || { students: 0, attendance: 0, engagementData: [0,0,0,0,0,0,0], upcomingClasses: [] }))
      .catch(console.error);
  }, []);

  const { students, attendance, engagementData } = stats;

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
    if (!form.title || !form.code || !form.description) { toast.error('Title, code, and description are required.'); return; }
    setCreating(true);
    try {
      const res = await courseApi.create(form);
      setCourses(p => [res.data.data, ...p]);
      setShowForm(false);
      setForm({ title:'', code:'', description:'', semester:'Semester 1', academicYear:'2025/2026' });
      toast.success('Workspace created successfully!');
    } catch (e) {
      const err = e as AxiosError<{message: string}>;
      toast.error(err.response?.data?.message || 'Failed to create workspace.');
    } finally { setCreating(false); }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth p-8 lg:p-12">
        <div className="max-w-[1400px] mx-auto">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar size={14} />
                <span>{currentDate}</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                {greeting}, {user?.name?.split(' ')[0]} 👋
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">
                You have <strong className="text-slate-900 font-bold">{students} active students</strong> to review and <strong className="text-slate-900 font-bold">{stats.upcomingClasses?.length || 0} upcoming classes</strong> today.
              </motion.p>
            </div>
            
            <motion.button 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              onClick={() => setShowForm(true)}
              className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              New Workspace
            </motion.button>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'My Workspaces', value: courses.length, icon: BookOpen, trend: '+1 this month', trendUp: true, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              { label: 'Active Students', value: students, icon: Users, trend: '+12% engagement', trendUp: true, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { label: 'Avg. Attendance', value: `${attendance}%`, icon: Activity, trend: '-2% vs last week', trendUp: false, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' }
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="relative overflow-hidden rounded-[24px] bg-white border border-slate-200 p-6 group hover:border-blue-200 transition-colors shadow-sm hover:shadow-md"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center`}>
                      <stat.icon size={22} className={stat.color} />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${stat.trendUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <h3 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">{loading ? '-' : stat.value}</h3>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content Area (Courses) */}
            <div className="xl:col-span-2 space-y-6">
              
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  Active Workspaces <Sparkles size={18} className="text-amber-400" />
                </h2>
                <Link href="/courses" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 group">
                  View all <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="h-28 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />)}
                </div>
              ) : courses.length === 0 ? (
                /* Premium Empty State */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-[32px] bg-white border border-slate-200 p-12 text-center relative overflow-hidden shadow-sm"
                >
                  <div className="relative z-10">
                    <div className="w-24 h-24 mx-auto bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-center mb-8 shadow-inner">
                      <Wand2 size={40} className="text-blue-600" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Start building your workspace</h3>
                    <p className="text-slate-500 font-medium text-lg max-w-lg mx-auto mb-10 leading-relaxed">
                      Create your first course to unlock analytics, assignments, and student engagement tools. Our AI assistant is ready to help you generate curriculum outlines.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
                      <button onClick={() => setShowForm(true)} className="group flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20">
                        <PenTool size={20} className="group-hover:rotate-12 transition-transform" /> Create Manually
                      </button>
                      <button className="group flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm">
                        <Sparkles size={20} className="text-amber-500 group-hover:animate-pulse" /> Generate with AI
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
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[24px] bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-5 mb-5 sm:mb-0">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                          <BookOpen size={24} className="text-indigo-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                              course.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>{course.status}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <span className="font-bold text-slate-700">{course.code}</span> • {course.semester} {course.academicYear}
                          </p>
                        </div>
                      </div>
                      
                      <Link href={`/courses/${course._id}`} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-sm font-bold transition-all shrink-0">
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
              <div className="rounded-[24px] bg-white border border-slate-200 p-7 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" /> Student Engagement
                </h3>
                
                {/* CSS Sparkline Bar Chart */}
                <div className="flex items-end justify-between gap-2 h-32 mb-4">
                  {engagementData.map((h, i) => (
                    <div key={i} className="w-full bg-slate-50 rounded-t-md relative group h-full flex items-end overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 1, delay: i * 0.1, type: "spring", stiffness: 50 }}
                        className="w-full bg-blue-500 rounded-t-md transition-all duration-300 group-hover:opacity-80" 
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {h}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>

              {/* Upcoming Classes Widget */}
              <div className="rounded-[24px] bg-white border border-slate-200 p-7 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" /> Upcoming Schedule
                </h3>
                <div className="space-y-4">
                  {!stats.upcomingClasses || stats.upcomingClasses.length === 0 ? (
                    <p className="text-sm font-medium text-slate-500">No upcoming schedule.</p>
                  ) : (
                    stats.upcomingClasses.map((item, i) => (
                      <Link key={i} href={item.type === 'Live Session' ? `/courses/${item.courseId}/live` : `/courses/${item.courseId}`} className="block">
                        <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className={`w-2.5 h-2.5 rounded-full ${item.color} mt-1.5`} />
                          <div>
                            <p className="text-sm font-extrabold text-slate-900 mb-0.5">{item.title}</p>
                            <p className="text-xs font-bold text-slate-500">
                              {new Date(item.time).toLocaleDateString()} {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <span className="mx-1">•</span> {item.type}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <button className="w-full mt-6 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-widest transition-colors">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[32px] shadow-2xl p-8 sm:p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create Workspace</h2>
                  <p className="text-slate-500 font-medium">Configure your new course environment.</p>
                </div>
                <button aria-label="Close modal" title="Close" onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="course-title" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Title</label>
                    <input id="course-title" required title="Course Title" placeholder="e.g. Advanced AI" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-sm" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
                  </div>
                  <div>
                    <label htmlFor="course-code" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Code</label>
                    <input id="course-code" required title="Course Code" placeholder="e.g. CS401" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-sm" value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value}))} />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label htmlFor="course-desc" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea id="course-desc" required rows={3} title="Description" placeholder="What will students learn in this workspace?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none font-medium text-sm" value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
                  </div>
                  <div className="relative">
                    <label htmlFor="course-sem" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semester</label>
                    <select 
                      id="course-sem"
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-sm cursor-pointer" value={form.semester} onChange={e => setForm(p=>({...p,semester:e.target.value}))}>
                      <option>Semester 1</option>
                      <option>Semester 2</option>
                    </select>
                    <div className="absolute bottom-0 right-4 h-12 flex items-center pointer-events-none text-slate-400">▼</div>
                  </div>
                  <div>
                    <label htmlFor="course-year" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Academic Year</label>
                    <input id="course-year" title="Academic Year" placeholder="e.g. 2025/2026" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-sm" value={form.academicYear} onChange={e => setForm(p=>({...p,academicYear:e.target.value}))} />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex gap-4 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 h-12 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating} className="flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none transition-all">
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
