'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { Course, LiveSession } from '@/types';
import CourseIntelligence from '@/components/dashboard/CourseIntelligence';
import { useAuth } from '@/context/AuthContext';
import { 
  BookOpen, FileText, FlaskConical, BarChart3, CheckSquare, 
  MessageSquare, Bell, Video, GraduationCap,
  Calendar, Building2, User, Activity, ArrowRight,
  Sparkles, Layers, Settings, Users, Share2
} from 'lucide-react';
import Link from 'next/link';
import { communicationApi } from '@/utils/api/communicationApi';

export default function CourseOverviewPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLive, setHasLive] = useState(false);

  useEffect(() => {
    if (courseId) {
      courseApi.getOne(courseId)
        .then(res => setCourse(res.data.data))
        .finally(() => setLoading(false));

      courseApi.getLiveSessions(courseId).then(res => {
        const active = (res.data.data || []).some((s: LiveSession) => s.status === 'live');
        setHasLive(active);
      });
    }
  }, [courseId]);

  const navigation = [
    { label:'Module Content', href:`/courses/${courseId}/modules`,       icon:BookOpen,      color:'text-blue-500',    bg:'bg-blue-50' },
    { label:'Assignments',   href:`/courses/${courseId}/assignments`,    icon:FileText,      color:'text-indigo-500',  bg:'bg-indigo-50' },
    { label:'Assessments',   href:`/courses/${courseId}/quizzes`,        icon:FlaskConical,  color:'text-purple-500',  bg:'bg-purple-50' },
    { label:'Academic Hub',  href:`/courses/${courseId}/grades`,         icon:BarChart3,     color:'text-emerald-500', bg:'bg-emerald-50' },
    { label:'Communications', href:`/courses/${courseId}/announcements`,  icon:Bell,          color:'text-amber-500',   bg:'bg-amber-50' },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="h-40 bg-slate-50 rounded-[32px]" />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-9 h-96 bg-slate-50 rounded-[32px]" />
        <div className="col-span-3 space-y-4">
           {[1,2,3,4].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Course Header Hero */}
      <section className="relative rounded-[32px] overflow-hidden bg-slate-900 text-white shadow-2xl shadow-slate-900/20">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent z-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-40 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        
        <div className="relative z-20 p-10 lg:p-14 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-primary-500 text-[10px] font-black uppercase tracking-widest">
                {course?.code}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
                {course?.semester} • {course?.academicYear}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight max-w-2xl leading-[1.1]">
              {course?.title}
            </h1>
            <div className="flex items-center gap-6 pt-4">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center font-bold text-xs uppercase">
                    {typeof course?.teacher === 'object' ? course.teacher?.name?.charAt(0) : 'T'}
                  </div>
                  <span className="text-sm font-bold text-slate-300">
                    Faculty: <span className="text-white">{typeof course?.teacher === 'object' ? course.teacher?.name : 'Academic Lead'}</span>
                  </span>
               </div>
               <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary-400" />
                  <span className="text-sm font-bold text-slate-300">84 Students Enrolled</span>
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {hasLive && (
              <Link href={`/courses/${courseId}/live`} className="btn bg-rose-500 hover:bg-rose-600 text-white h-14 px-8 shadow-xl shadow-rose-500/30">
                <div className="w-2 h-2 rounded-full bg-white animate-ping mr-2" />
                Join Live Now
              </Link>
            )}
            <div className="flex gap-2">
              <button 
                aria-label="Share Course"
                title="Share Course"
                className="btn btn-secondary h-12 w-12 p-0 rounded-xl"
              >
                <Share2 size={18} />
              </button>
              <Link 
                href={`/courses/${courseId}/settings`} 
                aria-label="Course Settings"
                title="Course Settings"
                className="btn btn-secondary h-12 w-12 p-0 rounded-xl"
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Main Intelligence Panel */}
        <div className="lg:col-span-9">
          <CourseIntelligence />
        </div>

        {/* Quick Access Sidebar */}
        <div className="lg:col-span-3 space-y-10">
          <div>
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2">Knowledge Access</h3>
            <div className="space-y-2">
              {navigation.map((item, idx) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link 
                    href={item.href}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                        <item.icon size={18} strokeWidth={2.5} />
                      </div>
                      <span className="text-[13px] font-bold text-slate-700 group-hover:text-primary-500 transition-colors tracking-tight">{item.label}</span>
                    </div>
                    <ArrowRight size={14} className="text-slate-200 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Smart Summary Card */}
          <div className="card-premium p-8 bg-slate-50 border-none shadow-sm overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary-500/10 transition-colors" />
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
               <Activity size={14} className="text-primary-500" /> Syllabus Status
             </h4>
             <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                     <span className="text-xs font-bold text-slate-600">Module Completion</span>
                     <span className="text-sm font-black text-slate-900">62%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                     <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '62%' }}
                      className="h-full bg-primary-500 rounded-full" 
                     />
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckSquare size={16} />
                   </div>
                   <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Attendance: 94%</span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
