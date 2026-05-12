'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { Course } from '@/types';
import CourseIntelligence from '@/components/dashboard/CourseIntelligence';
import { useAuth } from '@/context/AuthContext';
import { 
  BookOpen, FileText, FlaskConical, BarChart3, CheckSquare, 
  MessageSquare, Bell, Video, GraduationCap,
  Calendar, Building2, User, Activity, ArrowRight,
  Sparkles, Layers
} from 'lucide-react';
import Link from 'next/link';
import { communicationApi } from '@/utils/api/communicationApi';
export default function CourseOverviewPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user, logout } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLive, setHasLive] = useState(false);

  useEffect(() => {
    if (courseId) {
      courseApi.getOne(courseId)
        .then(res => setCourse(res.data.data))
        .finally(() => setLoading(false));

      communicationApi.getMyNotifications().then(res => {
        const unread = res.data.data.filter((n: { isRead: boolean }) => !n.isRead).length;
        setUnreadCount(unread);
      });

      courseApi.getLiveSessions(courseId).then(res => {
        const active = (res.data.data || []).some((s: any) => s.status === 'live');
        setHasLive(active);
      });
    }
  }, [courseId]);

  const sections = [
    { label:'Syllabus',      href:`/courses/${courseId}/modules`,       icon:BookOpen,      color:'text-blue-600',    bg:'bg-blue-50' },
    { label:'Assignments',   href:`/courses/${courseId}/assignments`,    icon:FileText,      color:'text-indigo-600',  bg:'bg-indigo-50' },
    { label:'Assessments',   href:`/courses/${courseId}/quizzes`,        icon:FlaskConical,  color:'text-purple-600',  bg:'bg-purple-50' },
    { label:'Academic Hub',  href:`/courses/${courseId}/grades`,         icon:BarChart3,     color:'text-emerald-600', bg:'bg-emerald-50' },
    { label:'Attendance',    href:`/courses/${courseId}/attendance`,     icon:CheckSquare,   color:'text-teal-600',    bg:'bg-teal-50' },
    { label:'Live Classes',  href:`/courses/${courseId}/live`,           icon:Video,         color:'text-rose-600',    bg:'bg-rose-50' },
    { label:'Communications', href:`/courses/${courseId}/announcements`,  icon:Bell,          color:'text-indigo-600',  bg:'bg-indigo-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      
      {/* Intelligence Header */}
      <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
         <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
            >
              <Sparkles size={14} />
              Intelligent Workspace Active
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6"
            >
              Course <span className="text-blue-600 text-shadow-sm">Intelligence.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed"
            >
              Welcome to your command center. Monitor performance, engage with students, and manage your curriculum with world-class precision.
            </motion.p>
         </div>
         
         <div className="flex gap-4">
            {hasLive && (
              <Link href={`/courses/${courseId}/live`} className="flex items-center gap-3 px-8 h-16 rounded-2xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/30 animate-pulse active:scale-95">
                 <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                 Join Live Class
              </Link>
            )}
            <Link href={`/courses/${courseId}/modules`} className="flex items-center gap-3 px-8 h-16 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
               <Layers size={18} /> Manage Content
            </Link>
            <Link href={`/courses/${courseId}/announcements`} className="flex items-center gap-3 px-8 h-16 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
               <Bell size={18} /> Broadcast
            </Link>
         </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         
         {/* Left Column: Analytics & Sentinel */}
         <div className="lg:col-span-9 space-y-12">
            <CourseIntelligence />
         </div>

         {/* Right Column: Section Navigation */}
         <div className="lg:col-span-3">
            <div className="sticky top-12 space-y-8">
               <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Navigation</h3>
                  <div className="space-y-3">
                     {sections.map((section, idx) => (
                        <motion.div
                          key={section.href}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                           <Link 
                             href={section.href}
                             className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
                           >
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${section.bg} ${section.color}`}>
                                    <section.icon size={18} />
                                 </div>
                                 <span className="text-sm font-black text-slate-700 group-hover:text-blue-600 transition-colors">{section.label}</span>
                              </div>
                              <ArrowRight size={14} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                           </Link>
                        </motion.div>
                     ))}
                  </div>
               </div>

               {/* System Health Card */}
               <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Workspace Health</h4>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between text-xs font-bold">
                        <span className="opacity-60">Sync Status</span>
                        <span className="text-emerald-400">Optimal</span>
                     </div>
                     <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[94%] bg-blue-500 rounded-full" />
                     </div>
                  </div>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}
