'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { studentApi } from '@/utils/api/studentApi';
import { 
  BookOpen, Calendar, Clock, ChevronRight, Activity, 
  Sparkles, TrendingUp, CheckCircle2, AlertCircle,
  Play, Timer, Star, Award, Loader2
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

interface Course {
  _id: string;
  code: string;
  title: string;
  status: string;
  semester: string;
  academicYear: string;
  coverImage?: string;
  progress?: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    overallCompletion: 0, 
    assignmentsSubmitted: 0, 
    studyHours: 0, 
    gpa: 0, 
    onTimeRate: 100,
    totalCourses: 0
  });
  const [milestones, setMilestones] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const [coursesRes, milestonesRes, statsRes] = await Promise.all([
        courseApi.getMyCourses(),
        studentApi.getMyMilestones(),
        studentApi.getMyStats()
      ]);
      setCourses(coursesRes.data.data || []);
      setMilestones(milestonesRes.data.data || []);
      setStats(prev => ({ ...prev, ...(statsRes.data.data || {}) }));
    } catch (error) {
      console.error('Dashboard sync error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      socket.on('notification', (data) => {
        console.log('📡 Dashboard update received:', data);
        fetchDashboardData(); // Re-sync everything when a notification arrives
      });
    }

    return () => {
      if (socket) socket.off('notification');
    };
  }, [socket]);

  const activeCourses = courses.filter(c => c.status === 'active');
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <div className="space-y-12 pb-12">
        {/* Welcome Hero */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest"
            >
              <Sparkles size={12} />
              Real-time Academic Pulse
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              {greeting},<br />
              <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-500 text-sm max-w-xl font-medium leading-relaxed line-clamp-2">
              Welcome back to your workspace. You have <span className="text-slate-900 font-bold">{milestones.length} active milestones</span> requiring your attention.
            </p>
          </div>

          <div className="flex gap-4">
             <Link href="/courses" className="btn btn-primary h-14 px-8 text-base shadow-xl shadow-primary-500/20">
               <Play size={18} fill="currentColor" /> Access Courseware
             </Link>
          </div>
        </section>

        {/* Intelligence Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Academic Standing', value: `${stats.gpa} GPA`, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', trend: stats.gpa > 3.5 ? 'Excellent' : 'On Track' },
            { label: 'Platform Effort', value: `${stats.studyHours}h`, icon: Timer, color: 'text-primary-500', bg: 'bg-primary-50', trend: 'Live Sync' },
            { label: 'Submissions', value: stats.assignmentsSubmitted, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: `${stats.onTimeRate}% Success` },
            { label: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-50', trend: 'Current Term' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="card-premium card-premium-hover p-6 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.trend}</div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">{stat.label}</p>
                <h3 className="text-3xl font-display font-extrabold text-slate-900">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Workspace */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">Current Workspace</h2>
              <Link href="/courses" className="text-xs font-bold text-primary-500 uppercase tracking-widest hover:text-primary-700 flex items-center gap-2 group transition-all">
                Access All Modules <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-[24px] bg-slate-50 animate-pulse border border-slate-100" />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="card-premium p-12 text-center bg-slate-50/50 border-dashed border-2 border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl shadow-sm mx-auto flex items-center justify-center mb-6 border border-slate-100">
                  <BookOpen size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Courses</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 font-medium">Your academic workspace is empty. Discover new courses in the catalog.</p>
                <Link href="/courses" className="btn btn-primary">Browse Catalog</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((course, idx) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                  >
                    <Link href={`/courses/${course._id}`} className="card-premium card-premium-hover block p-0 overflow-hidden group">
                       <div className="h-32 bg-slate-900 relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 z-10" />
                          <div className="absolute inset-0 bg-primary-500 opacity-20" />
                          <div className="absolute top-4 left-4 z-20">
                             <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                               {course.code}
                             </span>
                          </div>
                          {course.coverImage && (
                            <img src={course.coverImage} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                          )}
                       </div>
                       <div className="p-6">
                          <h3 className="text-[15px] font-display font-extrabold text-slate-900 mb-2 group-hover:text-primary-500 transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
                            {course.title}
                          </h3>
                          <div className="space-y-4 mt-6 pt-4 border-t border-slate-50">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <Activity size={14} className={course.progress && course.progress > 0 ? "text-emerald-500" : "text-slate-300"} />
                                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                     {course.progress || 0}% Processed
                                   </span>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                             </div>
                             <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${course.progress || 0}%` }}
                                  className={`h-full rounded-full ${course.progress && course.progress > 70 ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                />
                             </div>
                          </div>
                       </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Productivity Sidebar */}
          <div className="space-y-8">
            {/* Academic Health */}
            <div className="card-premium p-8 bg-slate-900 text-white border-none shadow-2xl shadow-primary-900/20 overflow-hidden relative">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500 rounded-full blur-[80px] opacity-20" />
               <div className="relative z-10">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary-400 mb-6 flex items-center gap-2">
                    <TrendingUp size={14} /> Performance Sync
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold">Knowledge Mastery</span>
                        <span className="text-xl font-display font-black">{stats.overallCompletion}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.overallCompletion}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary-400 to-indigo-400 rounded-full" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                       <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                          <Award size={20} />
                       </div>
                       <div>
                          <p className="text-[11px] font-bold text-primary-400 uppercase tracking-widest leading-none mb-1">Focus Streak</p>
                          <p className="text-lg font-display font-extrabold leading-none">{Math.floor(stats.assignmentsSubmitted / 2) + 3} Day Active</p>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Smart Reminders */}
            <div className="card-premium p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <AlertCircle size={16} className="text-primary-500" /> Pulse Feed
                </h3>
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              </div>

              <div className="space-y-6">
                {milestones.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Workspace is clear</p>
                  </div>
                ) : (
                  milestones.slice(0, 4).map((item, i) => (
                    <Link 
                      key={i} 
                      href={item.type === 'live_session' ? `/courses/${item.course?._id}/live` : `/courses/${item.course?._id}`}
                      className="flex items-start gap-4 group cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        item.type === 'live_session' 
                        ? 'bg-rose-50 border-rose-100 text-rose-500 group-hover:bg-rose-500 group-hover:text-white' 
                        : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500'
                      }`}>
                         {item.type === 'live_session' ? <Activity size={18} /> : <Calendar size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-[13px] font-bold text-slate-900 truncate tracking-tight group-hover:text-primary-500 transition-colors" title={item.title}>{item.title}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                            <Clock size={12} /> {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                         </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <Link href="/notifications" className="btn btn-secondary w-full mt-10 h-11 text-xs uppercase tracking-widest font-black">
                View Full Timeline
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}
