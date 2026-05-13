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
import DashboardLayout from '@/layouts/DashboardLayout';

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
    <DashboardLayout>
      <div className="space-y-8">
        {/* Course Header Bar */}
        <div className="bg-white rounded-[32px] border border-slate-100 p-8 lg:p-10 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
             <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <Link href="/courses" className="hover:text-primary-500 transition-colors">Courses</Link>
                  <ChevronRight size={12} className="text-slate-300" />
                  <span className="text-slate-900 truncate max-w-[200px]">{course.title}</span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-100 text-[10px] font-black uppercase tracking-widest">
                    {course.code}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    course.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {course.status}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Sparkles size={12} className="text-amber-400" />
                    {course.semester} · {course.academicYear}
                  </div>
                </div>

                <h1 className="text-3xl lg:text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">
                  {course.title}
                </h1>
             </div>

             <div className="flex items-center gap-3">
               {isOwner && (
                 <Link href={`/courses/${courseId}/settings`} className="btn btn-primary h-12 px-6 gap-2 shadow-lg shadow-primary-500/20">
                   <SettingsIcon size={18} /> Manage Course
                 </Link>
               )}
             </div>
           </div>

           {/* Tabs Navigation */}
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-10 -mb-2">
             {tabs.map(tab => {
               const isActive = pathname === tab.href || (tab.href !== `/courses/${courseId}` && pathname.startsWith(tab.href));
               return (
                 <Link 
                   key={tab.href} 
                   href={tab.href} 
                   className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
                     isActive 
                       ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                       : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                   }`}
                 >
                   <tab.icon size={14} strokeWidth={2.5} />
                   {tab.label}
                 </Link>
               );
             })}
           </div>
        </div>

        {/* Workspace Content */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-[500px]"
        >
          {children}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
