'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { useTeacherStats, useTeacherCourses } from '@/hooks/queries/useTeacherDashboard';
import { queryKeys } from '@/lib/queryKeys';
import { AxiosError } from 'axios';
import { 
  BookOpen, Plus, Sparkles, TrendingUp, Users, Clock, Calendar, 
  ArrowRight, Wand2, PenTool, CheckCircle2, ChevronRight, Activity, X, Loader2,
  ListTodo, UserPlus, PlayCircle, FileText, Send, Bell
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

interface UpcomingClass {
  title: string;
  type: string;
  time: string;
  courseId: string;
  color: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title:'', code:'', description:'', semester:'Semester 1', academicYear:'2025/2026' });

  const { data: stats = { students: 0, attendance: 0, engagementData: [0,0,0,0,0,0,0], upcomingClasses: [] as UpcomingClass[] } } = useTeacherStats(Boolean(user));
  const { data: rawCourses = [], isLoading: loading } = useTeacherCourses(user?._id, Boolean(user));
  const courses = (rawCourses as Course[] || []).filter((c): c is Course => c !== null && c !== undefined);

  const { students, attendance, engagementData } = stats;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.code) { toast.error('Title and code are required.'); return; }
    
    setCreating(true);
    
    // Quick Start Modal redirects to the full-page Course Wizard builder
    const params = new URLSearchParams({
      title: form.title,
      code: form.code
    });
    
    router.push(`/admin/courses/new?${params.toString()}`);
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const isNewUser = !loading && courses.length === 0;
  const hasClassesToday = stats.upcomingClasses?.length > 0;

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto">
      
      {/* 1. TOP BAR (Context + Control) */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Calendar size={14} />
            <span>{currentDate}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-3 leading-none">
            {greeting}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">
            {hasClassesToday 
              ? <>You have <strong className="text-slate-900 font-bold">{stats.upcomingClasses.length} classes</strong> scheduled today.</>
              : <>Your schedule is clear for today. Focus on planning and content creation.</>
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm">
            <Sparkles size={18} className="text-amber-500" />
            AI Assistant
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-md shadow-primary-600/20 transition-all"
          >
            <Plus size={18} />
            Create Course
          </button>
        </div>
      </header>

      {/* 2. ONBOARDING LAYER (First-Time User Experience) */}
      {isNewUser && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-primary-100 rounded-[24px] p-8 shadow-sm relative overflow-hidden"
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome to UniLearn LMS 👋</h2>
          <p className="text-slate-500 font-medium mb-8 max-w-xl">
            Your academic workspace is ready. Let’s set up your classroom and get you ready for teaching. Complete these steps to launch:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-50 border border-primary-100">
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 size={14} /></div>
              <div>
                <h4 className="font-bold text-primary-900 text-sm">Create your first course</h4>
                <p className="text-xs text-primary-700 font-medium mt-1">Initialize your syllabus and settings.</p>
                <button onClick={() => setShowForm(true)} className="mt-3 text-xs font-bold text-primary-700 underline">Start now &rarr;</button>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-700 text-sm">Add your students</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Invite learners via email or sync roster.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-700 text-sm">Schedule a class</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Set up your first live lecture or sync.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 opacity-60">
              <div className="w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-700 text-sm">Upload learning material</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Add documents, slides, and syllabus.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. PRIMARY ACTION ZONE */}
      {!isNewUser && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => setShowForm(true)} className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <BookOpen size={24} />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">Create Course</span>
          </button>
          <button className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Calendar size={24} />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">Schedule Class</span>
          </button>
          <button className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <UserPlus size={24} />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">Add Students</span>
          </button>
          <button onClick={() => router.push('/admin/courses/new?ai=true')} className="flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Sparkles size={24} />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">AI Generator</span>
          </button>
        </div>
      )}

      {/* 4. SMART METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users size={20} /></div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Students</h3>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-900 mb-2">{students}</div>
            {students === 0 
              ? <p className="text-sm font-medium text-blue-600 flex items-center gap-1 cursor-pointer hover:underline"><ArrowRight size={14}/> Add students to track engagement</p>
              : <p className="text-sm font-medium text-emerald-600 bg-emerald-50 inline-flex px-2 py-1 rounded-md border border-emerald-100">+12% enrolled this term</p>
            }
          </div>
        </div>

        <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Activity size={20} /></div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Avg. Attendance</h3>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-900 mb-2">{attendance > 0 ? `${attendance}%` : '—'}</div>
            {attendance === 0 
              ? <p className="text-sm font-medium text-amber-600 flex items-center gap-1"><ArrowRight size={14}/> No classes held yet</p>
              : <p className="text-sm font-medium text-slate-500">Across all active courses</p>
            }
          </div>
        </div>

        <div className="rounded-[24px] bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><BookOpen size={20} /></div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Courses</h3>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-slate-900 mb-2">{courses.length}</div>
            {courses.length === 0 
              ? <p className="text-sm font-medium text-indigo-600 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setShowForm(true)}><ArrowRight size={14}/> Create your first course</p>
              : <p className="text-sm font-medium text-slate-500">Currently published</p>
            }
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 5. CORE WORKSPACE MODULE (Courses) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              Your Courses
            </h2>
            <Link href="/courses" className="text-sm font-bold text-primary-600 hover:underline transition-colors flex items-center gap-1">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />)}
            </div>
          ) : !isNewUser && (
            <div className="grid gap-4">
              {courses.slice(0, 5).map((course: Course, idx) => (
                <div key={course._id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[20px] bg-white border border-slate-200 hover:border-primary-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                      <BookOpen size={20} className="text-slate-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors">{course.title}</h3>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-2 mt-1">
                        <span className="font-bold text-slate-700">{course.studentCount || 0} Students</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        Next class: {hasClassesToday ? '2:00 PM' : 'Unscheduled'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/courses/${course._id}/analytics`} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors">
                      Analytics
                    </Link>
                    <Link href={`/courses/${course._id}`} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors">
                      Open Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI, ACTIVITY, SCHEDULE */}
        <div className="space-y-6">
          
          {/* 6. AI INTEGRATION */}
          <div className="rounded-[24px] bg-slate-900 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500 rounded-full blur-[60px] opacity-20" />
            <h3 className="text-xs font-black text-primary-400 mb-5 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={16} /> AI Assistant
            </h3>
            
            <p className="text-slate-300 text-sm font-medium mb-4">What can I help you create today?</p>
            <div className="space-y-2 mb-5">
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm font-bold transition-colors">
                Generate lesson plans <ArrowRight size={14} className="text-slate-500" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm font-bold transition-colors">
                Create a quiz draft <ArrowRight size={14} className="text-slate-500" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-sm font-bold transition-colors">
                Analyze student performance <ArrowRight size={14} className="text-slate-500" />
              </button>
            </div>
            
            <div className="relative">
              <input type="text" placeholder="Ask AI..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all" />
              <button 
                type="button"
                aria-label="Send query to AI"
                title="Send query to AI"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary-600 rounded-lg text-white hover:bg-primary-500 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* 8. ACTIVITY FEED */}
          <div className="rounded-[24px] bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 mb-5 uppercase tracking-widest flex items-center gap-2">
              <Bell size={16} className="text-slate-400" /> Recent Activity
            </h3>
            <div className="space-y-4">
              {isNewUser ? (
                <p className="text-sm font-medium text-slate-500 text-center py-4">No activity yet. Your feed will populate as students engage.</p>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">5 students enrolled</p>
                      <p className="text-xs text-slate-500">In Intro to Programming</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">AI drafted Quiz 1</p>
                      <p className="text-xs text-slate-500">Ready for your review</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">System Maintenance</p>
                      <p className="text-xs text-slate-500">Scheduled for tonight</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 9. SCHEDULE PANEL */}
          <div className="rounded-[24px] bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 mb-5 uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-amber-500" /> {"Today's Schedule"}
            </h3>
            
            {stats.upcomingClasses?.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingClasses.map((item, i) => (
                  <Link key={i} href={`/courses/${item.courseId}/live`} className="block">
                    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color} mt-1.5`} />
                      <div>
                        <p className="text-sm font-extrabold text-slate-900 mb-0.5">{item.title}</p>
                        <p className="text-xs font-bold text-slate-500">
                          {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} <span className="mx-1">•</span> {item.type}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                  <Calendar size={20} />
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">No classes yet</p>
                <p className="text-xs font-medium text-slate-500 mb-4">Your schedule is empty for today.</p>
                <button className="text-xs font-bold text-primary-600 bg-primary-50 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors">
                  + Schedule a Class
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

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
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Create Course Quickly</h2>
                  <p className="text-slate-500 font-medium">Start your new course environment.</p>
                </div>
                <button 
                  type="button"
                  aria-label="Close modal" 
                  title="Close modal" 
                  onClick={() => setShowForm(false)} 
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Title</label>
                    <input required placeholder="e.g. Intro to Programming" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-bold text-sm" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Code</label>
                    <input required placeholder="e.g. CS101" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none font-bold text-sm" value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value}))} />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex gap-4 justify-end">
                  <button type="button" onClick={() => setShowForm(false)} className="px-6 h-12 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating} className="flex items-center justify-center gap-2 px-8 h-12 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-md shadow-primary-600/20 hover:bg-primary-700 disabled:opacity-50 transition-all">
                    {creating ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                    {creating ? 'Redirecting...' : 'Continue Setup'}
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
