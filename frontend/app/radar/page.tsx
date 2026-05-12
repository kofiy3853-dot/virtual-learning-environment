'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, Calendar as CalendarIcon, Clock, ChevronRight, 
  Star, MessageSquare, Video, Loader2, Search,
  Filter, Sparkles, AlertCircle, CheckCircle2,
  ArrowRight, BookOpen, GraduationCap, Timer
} from 'lucide-react';
import { courseApi } from '@/utils/api/courseApi';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { format, isToday, isTomorrow, isWithinInterval, addDays } from 'date-fns';
import Link from 'next/link';

interface Milestone {
  id: string;
  type: 'assignment' | 'quiz' | 'live_session';
  title: string;
  deadline: string;
  priority?: 'high' | 'normal' | 'low';
  course: {
    _id: string;
    title: string;
  };
}

type MilestoneType = 'assignment' | 'quiz' | 'live_session';
type FilterType = 'all' | MilestoneType;

export default function AcademicRadarPage() {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    courseApi.getGlobalMilestones()
      .then(res => setMilestones(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredMilestones = milestones.filter(m => {
    if (filter === 'all') return true;
    return m.type === filter;
  });

  const getStatusColor = (type: MilestoneType) => {
    switch (type) {
      case 'quiz': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'assignment': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'live_session': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getIcon = (type: MilestoneType) => {
    switch (type) {
      case 'quiz': return <Timer size={18} />;
      case 'assignment': return <BookOpen size={18} />;
      case 'live_session': return <Video size={18} />;
      default: return <GraduationCap size={18} />;
    }
  };

  return (
    <DashboardLayout>
       <div className="max-w-6xl mx-auto py-12 px-6 lg:px-8">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
             <div>
                <div className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                   <Radar size={14} className="animate-pulse" /> Academic Radar Active
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">The Horizon.</h1>
                <p className="text-xl text-slate-500 font-medium max-w-xl">
                   Your synchronized timeline of academic milestones, sessions, and evaluations across the UniLearn ecosystem.
                </p>
             </div>

             <div className="flex bg-white rounded-2xl p-1.5 border border-slate-200 shadow-sm self-start md:self-end">
                {(['all', 'assignment', 'quiz', 'live_session'] as const).map((f) => (
                   <button
                     key={f}
                     onClick={() => setFilter(f)}
                     className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                     }`}
                   >
                      {f.replace('_', ' ')}
                   </button>
                ))}
             </div>
          </header>

          {loading ? (
             <div className="h-[400px] flex flex-col items-center justify-center gap-4 bg-white rounded-[48px] border border-slate-100">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Radar Stream...</p>
             </div>
          ) : filteredMilestones.length === 0 ? (
             <div className="h-[400px] flex flex-col items-center justify-center gap-6 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                   <CalendarIcon size={40} />
                </div>
                <div className="text-center">
                   <h3 className="text-2xl font-black text-slate-900 mb-2">Horizon Clear.</h3>
                   <p className="text-slate-500 font-medium">No upcoming academic milestones were detected on your radar.</p>
                </div>
             </div>
          ) : (
             <div className="space-y-20 relative">
                {/* Timeline Line */}
                <div className="absolute left-10 md:left-1/2 top-0 bottom-0 w-px bg-slate-100 -translate-x-1/2 hidden md:block" />

                {filteredMilestones.map((milestone, idx) => {
                   const date = new Date(milestone.deadline);
                   const isCritical = milestone.priority === 'high';
                   const side = idx % 2 === 0 ? 'left' : 'right';

                   return (
                      <motion.div 
                        key={milestone.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`flex flex-col md:flex-row items-center gap-8 md:gap-24 relative ${
                          side === 'right' ? 'md:flex-row-reverse' : ''
                        }`}
                      >
                         {/* Radar Node */}
                         <div className="absolute left-10 md:left-1/2 -translate-x-1/2 z-10 hidden md:block">
                            <div className={`w-4 h-4 rounded-full border-4 border-white shadow-md ${
                              isCritical ? 'bg-rose-500 ring-4 ring-rose-500/20 animate-pulse' : 'bg-blue-600'
                            }`} />
                         </div>

                         {/* Content Card */}
                         <div className={`w-full md:w-[calc(50%-48px)] ${side === 'left' ? 'md:text-right' : 'md:text-left'}`}>
                            <div className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${
                               side === 'left' ? 'md:justify-end' : 'md:justify-start'
                            } ${isCritical ? 'text-rose-600' : 'text-slate-400'}`}>
                               {isToday(date) ? (
                                  <span className="flex items-center gap-1.5"><Sparkles size={12} /> Happening Today</span>
                               ) : isTomorrow(date) ? (
                                  'Happening Tomorrow'
                               ) : format(date, 'EEEE, MMM dd')}
                               <span className="w-1 h-1 rounded-full bg-slate-200" />
                               {format(date, 'p')}
                            </div>

                            <Link 
                              href={milestone.type === 'assignment' ? `/courses/${milestone.course._id}/assignments/${milestone.id}` : milestone.type === 'quiz' ? `/courses/${milestone.course._id}/quizzes/${milestone.id}` : `/courses/${milestone.course._id}/live`}
                              className="block"
                            >
                               <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm hover:shadow-2xl hover:shadow-slate-900/5 transition-all group relative overflow-hidden">
                                  {isCritical && (
                                     <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500" />
                                  )}
                                  
                                  <div className={`flex flex-col ${side === 'left' ? 'md:items-end' : 'md:items-start'} gap-6`}>
                                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 ${getStatusColor(milestone.type)}`}>
                                        {getIcon(milestone.type)}
                                     </div>

                                     <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                           {milestone.title}
                                        </h3>
                                        <div className={`flex items-center gap-2 ${side === 'left' ? 'md:justify-end' : 'md:justify-start'}`}>
                                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{milestone.course.title}</span>
                                           <span className="w-1 h-1 rounded-full bg-slate-200" />
                                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{milestone.type.replace('_', ' ')}</span>
                                        </div>
                                     </div>

                                     <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors`}>
                                        Launch Terminal <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                     </div>
                                  </div>
                               </div>
                            </Link>
                         </div>

                         {/* Empty Space for the other side on desktop */}
                         <div className="hidden md:block w-[calc(50%-48px)]" />
                      </motion.div>
                   );
                })}
             </div>
          )}
       </div>
    </DashboardLayout>
  );
}
