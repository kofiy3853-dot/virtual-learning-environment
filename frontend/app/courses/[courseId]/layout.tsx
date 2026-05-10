'use client';
import { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import Sidebar from '@/components/shared/Sidebar';
import { Course } from '@/types';
import { 
  Home, BookOpen, FileText, FlaskConical, BarChart3, 
  CheckSquare, MessageSquare, Bell, Video, ChevronRight, 
  Loader2, Sparkles, GraduationCap, Settings as SettingsIcon 
} from 'lucide-react';

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const courseId = params.courseId as string;
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  const isTeacher = user?.role === 'teacher';
  const isOwner = isTeacher && (
    (typeof course?.teacher === 'object' && course.teacher?._id === user?._id) ||
    (course?.teacher === user?._id)
  );

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    let ignore = false;
    async function startFetching() {
      if (!courseId) return;
      try {
        const res = await courseApi.getOne(courseId);
        if (!ignore) setCourse(res.data.data);
      } catch {
        if (!ignore) setCourse(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    startFetching();
    return () => { ignore = true; };
  }, [courseId]);

  const tabs = [
    { label: 'Overview',     href: `/courses/${courseId}`,               icon: Home },
    { label: 'Modules',      href: `/courses/${courseId}/modules`,       icon: BookOpen },
    { label: 'Assignments',  href: `/courses/${courseId}/assignments`,    icon: FileText },
    { label: 'Quizzes',       href: `/courses/${courseId}/quizzes`,        icon: FlaskConical },
    { label: 'Grades',       href: `/courses/${courseId}/grades`,         icon: BarChart3 },
    { label: 'Attendance',   href: `/courses/${courseId}/attendance`,     icon: CheckSquare },
    { label: 'Discussions',  href: `/courses/${courseId}/discussions`,    icon: MessageSquare },
    { label: 'Announcements',href: `/courses/${courseId}/announcements`,  icon: Bell },
    { label: 'Live',         href: `/courses/${courseId}/live`,           icon: Video },
  ];

  if (loading) return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Loading workspace environment...</p>
        </div>
      </main>
    </div>
  );

  if (!course) return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center bg-white border border-slate-200 rounded-[40px] p-16 max-w-lg shadow-sm">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100 text-rose-600">
            <GraduationCap size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Course not found.</h2>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">The academic program you are looking for does not exist or has been archived.</p>
          <Link href="/courses" className="inline-flex items-center justify-center h-14 px-10 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs">
            Back to Catalog
          </Link>
        </div>
      </main>
    </div>
  );

  const activeTab = tabs.find(t => pathname === t.href || (t.href !== `/courses/${courseId}` && pathname.startsWith(t.href)));

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-8 left-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl border flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <Bell size={16} /> : <CheckSquare size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Top Header */}
        <div className="bg-white border-b border-slate-200 px-8 lg:px-12 pt-8 pb-0 shrink-0 shadow-sm relative z-20">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">
            <Link href="/courses" className="hover:text-blue-600 transition-colors">Courses</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <Link href={`/courses/${courseId}`} className="hover:text-blue-600 transition-colors truncate max-w-[200px]">{course.title}</Link>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-900">{activeTab?.label || 'Overview'}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {course.code}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                  course.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {course.status}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <Sparkles size={12} className="text-amber-400" />
                  {course.semester} · {course.academicYear}
                </div>
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter mb-2 truncate">
                {course.title}
              </h1>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-3">
              {isOwner && (
                <Link href={`/courses/${courseId}/settings`} className="flex items-center justify-center gap-3 h-12 px-8 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest">
                  <SettingsIcon size={16} /> Manage Workspace
                </Link>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar pb-0 border-b-0 border-slate-200">
            {tabs.map(tab => {
              const isActive = pathname === tab.href || (tab.href !== `/courses/${courseId}` && pathname.startsWith(tab.href));
              return (
                <Link key={tab.href} href={tab.href} className={`flex items-center gap-2.5 px-6 py-4 border-b-[3px] font-black text-[11px] uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-300 ${
                  isActive 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl' 
                    : 'border-transparent text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-t-xl'
                }`}>
                  <tab.icon size={16} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth bg-slate-50/30">
          <motion.div 
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1400px] mx-auto"
          >
            {children}
          </motion.div>
        </div>

      </main>
    </div>
  );
}
