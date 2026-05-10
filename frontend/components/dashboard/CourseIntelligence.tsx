'use client';

import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { 
  Activity, Users, Target, BookOpen, AlertCircle, 
  ArrowUpRight, ArrowDownRight, MessageSquare, Plus,
  Bell, Video, Zap, GraduationCap, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const engagementData = [
  { name: 'Mon', active: 45 },
  { name: 'Tue', active: 52 },
  { name: 'Wed', active: 48 },
  { name: 'Thu', active: 70 },
  { name: 'Fri', active: 65 },
  { name: 'Sat', active: 30 },
  { name: 'Sun', active: 25 },
];

const gradeData = [
  { range: 'A', count: 12 },
  { range: 'B', count: 25 },
  { range: 'C', count: 18 },
  { range: 'D', count: 8 },
  { range: 'F', count: 3 },
];

export default function CourseIntelligence() {
  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Intelligence Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         <StatCard 
           icon={<Users size={20} />} 
           label="Active Students" 
           value="124" 
           trend="+12%" 
           trendUp={true} 
           color="blue"
         />
         <StatCard 
           icon={<Target size={20} />} 
           label="Avg. Course Grade" 
           value="78%" 
           trend="-2%" 
           trendUp={false} 
           color="emerald"
         />
         <StatCard 
           icon={<BookOpen size={20} />} 
           label="Content Completion" 
           value="64%" 
           trend="+5%" 
           trendUp={true} 
           color="indigo"
         />
         <StatCard 
           icon={<Activity size={20} />} 
           label="Weekly Interactions" 
           value="1.2k" 
           trend="+18%" 
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Student Activity over time</p>
               </div>
               <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">Daily</button>
                  <button className="px-4 py-2 rounded-xl bg-blue-600 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20">Weekly</button>
               </div>
            </div>
            
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagementData}>
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
               <h3 className="text-lg font-black tracking-tight mb-6 relative z-10">Control Center.</h3>
               <div className="space-y-3 relative z-10">
                  <ActionBtn icon={<Bell size={18} />} label="Broadcast Alert" />
                  <ActionBtn icon={<Video size={18} />} label="Live Session" />
                  <ActionBtn icon={<MessageSquare size={18} />} label="Class Discussion" />
                  <ActionBtn icon={<Plus size={18} />} label="Rapid Assignment" />
               </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Grade Distribution</h3>
               <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={gradeData}>
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                           {gradeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#2563EB' : '#F1F5F9'} />
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

      {/* Bottom Row: Risk Detection & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         <section className="xl:col-span-5 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-rose-500" />
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Sentinel Watch</h3>
               </div>
               <span className="px-3 py-1 rounded-full bg-rose-50 text-[10px] font-black uppercase tracking-widest text-rose-600">4 Students at Risk</span>
            </div>
            
            <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50 hover:bg-white hover:border-rose-100 transition-all group">
                     <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-slate-400 text-xs">
                        {String.fromCharCode(64 + i)}S
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900">Student Profile #{i}04</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[9px] font-bold text-rose-500 uppercase">Low Engagement</span>
                           <span className="w-1 h-1 rounded-full bg-slate-200" />
                           <span className="text-[9px] font-bold text-slate-400 uppercase">Last seen 4d ago</span>
                        </div>
                     </div>
                     <button className="p-2 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100">
                        <MessageSquare size={16} />
                     </button>
                  </div>
               ))}
            </div>
         </section>

         <section className="xl:col-span-7 bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Intelligence Stream</h3>
            <div className="space-y-6">
               <ActivityItem 
                 icon={<Zap size={14} />} 
                 label="Module 4 Interaction Spike" 
                 time="2 hours ago" 
                 detail="34 students completed 'Quantum Tunnelling' lecture."
                 color="blue"
               />
               <ActivityItem 
                 icon={<GraduationCap size={14} />} 
                 label="Gradebook Calibration" 
                 time="5 hours ago" 
                 detail="System automatically updated the passing curve based on recent results."
                 color="emerald"
               />
               <ActivityItem 
                 icon={<ArrowUpRight size={14} />} 
                 label="Enrollment Growth" 
                 time="Yesterday" 
                 detail="12 new students joined the course workspace."
                 color="indigo"
               />
            </div>
         </section>
      </div>

    </div>
  );
}

function StatCard({ icon, label, value, trend, trendUp, color }: any) {
  const colorMap: any = {
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

function ActionBtn({ icon, label }: any) {
  return (
    <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all group">
       <div className="flex items-center gap-3">
          <div className="text-blue-400 group-hover:text-white transition-colors">{icon}</div>
          <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
       </div>
       <ChevronRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </button>
  );
}

function ActivityItem({ icon, label, time, detail, color }: any) {
  const colors: any = {
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
