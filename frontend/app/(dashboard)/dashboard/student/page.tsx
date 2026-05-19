'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useStudentDashboard } from '@/hooks/queries/useStudentDashboard';
import { 
  BookOpen, Calendar, Clock, ChevronRight, Activity, 
  Sparkles, TrendingUp, CheckCircle2, AlertCircle,
  Play, Timer, Star, Award, BookOpenCheck, CalendarDays,
  CheckCircle, ArrowRight, Sparkle, Send, Bell
} from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

interface Course {
  _id: string;
  code: string;
  title: string;
  status: string;
  progress?: number;
  coverImage?: string;
}

interface Milestone {
  title: string;
  type: string;
  deadline: string;
  course?: {
    _id: string;
    code: string;
    title: string;
  };
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { data, isLoading, isError, refetch } = useStudentDashboard(Boolean(user));

  useEffect(() => {
    if (!socket) return;
    const onNotification = () => {
      void refetch();
    };
    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [socket, refetch]);

  const courses = (data?.courses ?? []).filter((c: any) => c !== null && c !== undefined);
  const milestones = (data?.milestones ?? []).filter((m: any) => m && m.course);
  const stats = data?.stats ?? {
    overallCompletion: 0,
    assignmentsSubmitted: 0,
    studyHours: 0,
    gpa: 0,
    onTimeRate: 100,
    totalCourses: 0,
  };
  const loading = isLoading;

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const isNewStudent = !loading && courses.length === 0;

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto">
      
      {/* 1. TOP BAR (Personal Context) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-2">
            <CalendarDays size={14} />
            <span>{currentDate}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-3 leading-none">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>You have</span>
            <strong className="text-slate-900 font-extrabold">2 classes today</strong>
            <span className="text-slate-300">•</span>
            <strong className="text-slate-900 font-extrabold">{milestones.length} pending tasks</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/courses" 
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-md shadow-primary-600/20 transition-all"
          >
            <Play size={16} fill="currentColor" />
            Access Courseware
          </Link>
        </div>
      </header>

      {/* 2. FIRST-TIME EXPERIENCE (Onboarding Checklist) */}
      {isNewStudent && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-primary-100 rounded-[24px] p-8 shadow-sm relative overflow-hidden"
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome to your workspace 👋</h2>
          <p className="text-slate-500 font-medium mb-8 max-w-xl">
            Let&apos;s get you started on your learning journey. Complete these tasks to set up your profile and explore learning pathways:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-50 border border-primary-100">
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 size={14} /></div>
              <div>
                <h4 className="font-bold text-primary-900 text-sm">Join a course</h4>
                <p className="text-xs text-primary-700 font-medium mt-1">Enroll via course code or catalog.</p>
                <Link href="/courses" className="mt-3 text-xs font-bold text-primary-700 underline block">Find course &rarr;</Link>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-700 text-sm">Complete first lesson</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Access study materials and tasks.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-700 text-sm">Submit your first task</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Verify submission and unlock analytics.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. PRIMARY ACTION PANEL */}
      {!isNewStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/courses" className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all group text-left">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors shrink-0">
              <Play size={20} fill="currentColor" />
            </div>
            <div>
              <span className="block font-extrabold text-slate-900 text-sm">Continue Last Lesson</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">Pick up exactly where you left off</span>
            </div>
          </Link>
          <Link href="/courses" className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-rose-300 hover:shadow-md transition-all group text-left">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <span className="block font-extrabold text-slate-900 text-sm">Join Live Class</span>
              <span className="text-xs text-rose-600 font-bold mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Live Now
              </span>
            </div>
          </Link>
          <Link href="/courses" className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group text-left">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
              <BookOpenCheck size={20} />
            </div>
            <div>
              <span className="block font-extrabold text-slate-900 text-sm">View Assignments</span>
              <span className="text-xs text-slate-500 font-medium mt-0.5 block">{milestones.length} tasks needing submission</span>
            </div>
          </Link>
        </div>
      )}

      {/* 6. PROGRESS TRACKING (Smart Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Star size={20} /></div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Academic Standing</h3>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats.gpa > 0 ? `${stats.gpa} GPA` : '—'}</div>
            {stats.gpa === 0 
              ? <p className="text-sm font-medium text-slate-500">Awaiting first graded task</p>
              : <p className="text-sm font-medium text-emerald-600 bg-emerald-50 inline-flex px-2 py-1 rounded-md border border-emerald-100">{stats.gpa > 3.5 ? 'Excellent Performance' : 'On Track'}</p>
            }
          </div>
        </div>

        <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Activity size={20} /></div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Attendance Rate</h3>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-900 mb-2">94%</div>
            <p className="text-sm font-medium text-slate-500">Across current academic year</p>
          </div>
        </div>

        <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><CheckCircle size={20} /></div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Task Submissions</h3>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-900 mb-2">{stats.assignmentsSubmitted}</div>
            <p className="text-sm font-medium text-indigo-600 flex items-center gap-1">{stats.onTimeRate}% on-time submission rate</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 4. MY COURSES (Main Product Area) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900">My Courses</h2>
            <Link href="/courses" className="text-sm font-bold text-primary-600 hover:underline transition-colors">View Catalog</Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />)}
            </div>
          ) : !isNewStudent && (
            <div className="grid gap-4">
              {courses.slice(0, 5).map((course: Course, idx) => (
                <div key={course._id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[20px] bg-white border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors shrink-0">
                        <BookOpen size={18} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors truncate">{course.title}</h3>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-1">
                          <span className="font-bold text-slate-700">{course.code}</span>
                          <span className="text-slate-300">•</span>
                          <span>Next class: 2:00 PM</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress || 0}%` }}
                          className="h-full bg-primary-600 rounded-full" 
                        />
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 shrink-0">{course.progress || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Link href={`/courses/${course._id}`} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors whitespace-nowrap">
                      View Details
                    </Link>
                    <Link href={`/courses/${course._id}`} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors whitespace-nowrap">
                      Continue
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI TUTOR, ASSIGNMENTS, SCHEDULE */}
        <div className="space-y-6">
          
          {/* 7. AI STUDY ASSISTANT */}
          <div className="rounded-[24px] bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500 rounded-full blur-[60px] opacity-20" />
            <h3 className="text-xs font-black text-primary-400 mb-5 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={16} /> AI Tutor
            </h3>
            
            <p className="text-slate-300 text-sm font-medium mb-4">What shall we study today?</p>
            <div className="space-y-2 mb-5">
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm font-bold transition-colors">
                Explain Programming loops <ArrowRight size={14} className="text-slate-500" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm font-bold transition-colors">
                Generate practice questions <ArrowRight size={14} className="text-slate-500" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm font-bold transition-colors">
                Help me solve assignment <ArrowRight size={14} className="text-slate-500" />
              </button>
            </div>
            
            <div className="relative">
              <input type="text" placeholder="Ask AI..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all" />
              <button 
                type="button" 
                aria-label="Ask AI Tutor"
                title="Ask AI Tutor"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary-600 rounded-lg text-white hover:bg-primary-500 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* 5. ASSIGNMENTS & PULSE */}
          <div className="rounded-[24px] bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 mb-5 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500" /> Upcoming Tasks
            </h3>
            
            <div className="space-y-4">
              {milestones.length === 0 ? (
                <p className="text-sm font-medium text-slate-500 text-center py-4">All clear! No assignments due.</p>
              ) : (
                milestones.slice(0, 4).map((item: any, i) => {
                  const relatedCourse = courses.find((c: any) => c._id === item.course?._id);
                  return (
                    <Link 
                      key={i} 
                      href={`/courses/${item.course?._id}/assignments`}
                      className="flex items-start gap-4 group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                        <Clock size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-slate-900 truncate tracking-tight group-hover:text-primary-500 transition-colors">{item.title}</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                          <span>{relatedCourse?.code || 'Task'}</span>
                          <span className="text-slate-300">•</span>
                          <span>Due {new Date(item.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* 8. SCHEDULE PANEL */}
          <div className="rounded-[24px] bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 mb-5 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-primary-500" /> Today&apos;s Schedule
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Programming Basics</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Live Interactive Session</p>
                </div>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">2:00 PM</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Data Analytics 101</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Pre-recorded Lecture</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">4:00 PM</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
