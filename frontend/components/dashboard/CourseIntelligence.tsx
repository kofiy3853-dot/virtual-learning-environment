'use client';

import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  Activity, Users, Target, BookOpen, AlertCircle, 
  ArrowUpRight, ArrowDownRight, MessageSquare, Plus,
  Bell, Video, Zap, GraduationCap, ChevronRight, Loader2, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { courseApi } from '@/utils/api/courseApi';

interface AnalyticsData {
  classAverage: number;
  highestScore: number;
  lowestScore: number;
  distribution: {
    'below50': number;
    '50-69': number;
    '70-89': number;
    '90-100': number;
  };
  completionRate: number;
}

interface AtRiskStudent {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  percentage: number;
}

export default function CourseIntelligence() {
  const { courseId } = useParams() as { courseId: string };
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      // Students are not authorized to view class-wide analytics
      if (user?.role === 'student') {
        setLoading(false);
        return;
      }

      try {
        const [analyticsRes, atRiskRes, studentsRes] = await Promise.all([
          courseApi.getAnalytics(courseId),
          courseApi.getAtRisk(courseId),
          courseApi.getStudents(courseId)
        ]);

        setAnalytics(analyticsRes.data.data);
        setAtRisk(atRiskRes.data.data || []);
        setStudentCount(studentsRes.data.data?.length || 0);
      } catch (err) {
        console.error('Failed to fetch course intelligence:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && user) {
      fetchData();
    }
  }, [courseId, user]);

  // Transform distribution for Recharts
  const gradeData = analytics?.distribution ? [
    { range: 'F', count: analytics.distribution['below50'] },
    { range: 'D/C', count: analytics.distribution['50-69'] },
    { range: 'B', count: analytics.distribution['70-89'] },
    { range: 'A', count: analytics.distribution['90-100'] },
  ] : [
    { range: 'F', count: 0 },
    { range: 'D/C', count: 0 },
    { range: 'B', count: 0 },
    { range: 'A', count: 0 },
  ];

  // Pulse data (mocked for now as backend doesn't provide time-series engagement yet)
  const pulseData = [
    { name: 'Mon', active: 45 },
    { name: 'Tue', active: 52 },
    { name: 'Wed', active: 48 },
    { name: 'Thu', active: 70 },
    { name: 'Fri', active: 65 },
    { name: 'Sat', active: 30 },
    { name: 'Sun', active: 25 },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm">
        <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Calibrating Intelligence...</p>
      </div>
    );
  }

  if (user?.role === 'student') {
    return (
      <div className="space-y-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <StatCard 
             icon={<Target size={20} />} 
             label="My Current Grade" 
             value="88%" 
             trend="High" 
             trendUp={true} 
             color="emerald"
           />
           <StatCard 
             icon={<BookOpen size={20} />} 
             label="Modules Completed" 
             value="4/12" 
             trend="On Track" 
             trendUp={true} 
             color="blue"
           />
           <StatCard 
             icon={<Activity size={20} />} 
             label="Attendance" 
             value="96%" 
             trend="Excellent" 
             trendUp={true} 
             color="indigo"
           />
        </div>

        <section className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Continue your journey.</h3>
              <p className="text-slate-500 font-medium mb-8">You're making great progress in this course. Keep up the momentum!</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Link href={`/courses/${courseId}/modules`} className="group p-6 rounded-3xl bg-slate-50 border border-slate-50 hover:bg-white hover:border-primary-100 hover:shadow-xl hover:shadow-primary-900/5 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary-500 mb-4 group-hover:scale-110 transition-transform">
                       <Zap size={20} />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-1">Resume Next Lesson</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Module 4: Advanced Architectures</p>
                 </Link>

                 <Link href={`/courses/${courseId}/assignments`} className="group p-6 rounded-3xl bg-slate-50 border border-slate-50 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-900/5 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                       <Target size={20} />
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-1">Upcoming Milestone</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Due in 2 days: Project Proposal</p>
                 </Link>
              </div>
           </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Intelligence Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         <StatCard 
           icon={<Users size={20} />} 
           label="Total Students" 
           value={String(studentCount)} 
           trend="Live" 
           trendUp={true} 
           color="blue"
         />
         <StatCard 
           icon={<Target size={20} />} 
           label="Avg. Course Grade" 
           value={`${analytics?.classAverage || 0}%`} 
           trend={analytics?.classAverage && analytics.classAverage > 75 ? "Healthy" : "Attention"} 
           trendUp={(analytics?.classAverage || 0) > 70} 
           color="emerald"
         />
         <StatCard 
           icon={<BookOpen size={20} />} 
           label="Engagement Rate" 
           value={`${analytics?.completionRate || 0}%`} 
           trend="Active" 
           trendUp={true} 
           color="indigo"
         />
         <StatCard 
           icon={<Activity size={20} />} 
           label="Highest Score" 
           value={`${analytics?.highestScore || 0}%`} 
           trend="Peak" 
           trendUp={true} 
           color="rose"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         
         {/* Engagement Pulse Chart */}
         <section className="lg:col-span-8 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Engagement Pulse</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">SaaS Learning Momentum</p>
               </div>
               <div className="flex gap-2">
                  <span className="px-4 py-2 rounded-xl bg-blue-50 text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100">Live Stream</span>
               </div>
            </div>
            
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pulseData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                     <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                       dy={10}
                     />
                     <YAxis hide />
                     <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                       labelStyle={{ fontWeight: 900, marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                     />
                     <Line 
                       type="monotone" 
                       dataKey="active" 
                       stroke="#2563EB" 
                       strokeWidth={4} 
                       dot={{ r: 6, fill: '#2563EB', strokeWidth: 3, stroke: '#fff' }}
                       activeDot={{ r: 8, strokeWidth: 0 }}
                     />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </section>

         {/* Quick Actions / Control Center */}
         <section className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-150 transition-transform duration-700" />
               <h3 className="text-lg font-black tracking-tight mb-6 relative z-10">Command Center.</h3>
               <div className="space-y-3 relative z-10">
                  <Link href={`/courses/${courseId}/announcements`} className="block">
                    <ActionBtn icon={<Bell size={18} />} label="Broadcast Message" />
                  </Link>
                  <Link href={`/courses/${courseId}/live`} className="block">
                    <ActionBtn icon={<Video size={18} />} label="Start Live Session" />
                  </Link>
                  <Link href={`/courses/${courseId}/discussions`} className="block">
                    <ActionBtn icon={<MessageSquare size={18} />} label="Manage Threads" />
                  </Link>
                  <Link href={`/courses/${courseId}/assignments`} className="block">
                    <ActionBtn icon={<Plus size={18} />} label="Add Assignment" />
                  </Link>
               </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Grade Distribution</h3>
               <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={gradeData}>
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                           {gradeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#2563EB' : '#F1F5F9'} />
                           ))}
                        </Bar>
                        <XAxis 
                           dataKey="range" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip cursor={{fill: 'transparent'}} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </section>

      </div>

      {/* Bottom Row: Sentinel Watch & Intelligence Stream */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         <section className="xl:col-span-5 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-500" />
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Sentinel Watch</h3>
               </div>
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${atRisk.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                 {atRisk.length} Students at Risk
               </span>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
               {atRisk.length === 0 ? (
                 <div className="py-12 text-center">
                    <CheckCircle2 size={32} className="text-emerald-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No risks detected</p>
                 </div>
               ) : atRisk.map((item) => (
                  <div key={item._id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50 hover:bg-white hover:border-rose-100 transition-all group">
                     <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-slate-400 text-xs uppercase">
                        {item.student.name.charAt(0)}
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900">{item.student.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[9px] font-bold text-rose-500 uppercase">Score: {item.percentage}%</span>
                           <span className="w-1 h-1 rounded-full bg-slate-200" />
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Critical Alert</span>
                        </div>
                     </div>
                      <Link 
                        href={`/messages?user=${item.student._id}`}
                        title="Message Student"
                        aria-label={`Send a direct message to ${item.student.name}`}
                        className="p-2 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                         <MessageSquare size={16} />
                      </Link>
                  </div>
               ))}
            </div>
         </section>

         <section className="xl:col-span-7 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Intelligence Stream</h3>
            <div className="space-y-6">
               <ActivityItem 
                 icon={<Zap size={14} />} 
                 label="Platform Synchronization" 
                 time="Just now" 
                 detail="Course metrics successfully calibrated with backend database."
                 color="blue"
               />
               <ActivityItem 
                 icon={<GraduationCap size={14} />} 
                 label="Academic Pulse" 
                 time="Automated" 
                 detail={`Course is currently maintaining a ${analytics?.classAverage || 0}% overall average score.`}
                 color="emerald"
               />
               <ActivityItem 
                 icon={<ArrowUpRight size={14} />} 
                 label="User Verification" 
                 time="Live" 
                 detail={`${studentCount} students currently enrolled in this active learning environment.`}
                 color="indigo"
               />
            </div>
         </section>
      </div>

    </div>
  );
}

function StatCard({ icon, label, value, trend, trendUp, color }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  trend: string, 
  trendUp: boolean, 
  color: 'blue' | 'emerald' | 'indigo' | 'rose'
}) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    rose: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all">
       <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
             {icon}
          </div>
          <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
             {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
             {trend}
          </div>
       </div>
       <div className="space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
       </div>
    </div>
  );
}

function ActionBtn({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all group cursor-pointer">
       <div className="flex items-center gap-3">
          <div className="text-blue-400 group-hover:text-white transition-colors">{icon}</div>
          <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
       </div>
       <ChevronRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </div>
  );
}

function ActivityItem({ icon, label, time, detail, color }: { 
  icon: React.ReactNode, 
  label: string, 
  time: string, 
  detail: string, 
  color: 'blue' | 'emerald' | 'indigo'
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600 shadow-blue-600/20',
    emerald: 'bg-emerald-600 shadow-emerald-600/20',
    indigo: 'bg-indigo-600 shadow-indigo-600/20',
  };

  return (
    <div className="flex gap-4">
       <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white shadow-lg ${colors[color]}`}>
          {icon}
       </div>
       <div className="flex-1 border-b border-slate-50 pb-4">
          <div className="flex items-center justify-between mb-1">
             <h4 className="text-sm font-black text-slate-900">{label}</h4>
             <span className="text-[10px] font-bold text-slate-400 uppercase">{time}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 leading-relaxed">{detail}</p>
       </div>
    </div>
  );
}
