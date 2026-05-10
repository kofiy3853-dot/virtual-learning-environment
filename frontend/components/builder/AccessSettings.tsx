'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, Globe, Lock, Users, Target, Clock, 
  AlertCircle, ChevronRight, UserPlus, Loader2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { adminApi } from '@/utils/api/adminApi';

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

export default function AccessSettings() {
  const [isPublic, setIsPublic] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  useEffect(() => {
    adminApi.getAllUsers({ role: 'teacher', limit: 100 })
      .then(res => setTeachers(res.data.data || []))
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">The Gatekeeper.</h2>
        <p className="text-slate-500 font-medium">Configure access protocols, enrollment rules, and faculty assignments.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Visibility Toggle */}
        <section className="bg-slate-50/50 rounded-[32px] border-2 border-slate-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${isPublic ? 'bg-emerald-50 text-emerald-600 shadow-emerald-600/10' : 'bg-blue-50 text-blue-600 shadow-blue-600/10'}`}>
                 {isPublic ? <Globe size={24} /> : <Lock size={24} />}
              </div>
              <div>
                 <h3 className="font-black text-slate-900 text-lg mb-1">Course Visibility</h3>
                 <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm">
                   {isPublic 
                     ? "Public courses are visible to the entire university catalog and allow open enrollment." 
                     : "Private courses require an enrollment key or direct invitation to access."}
                 </p>
              </div>
           </div>
           
           <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm shrink-0">
              <button 
                onClick={() => setIsPublic(false)}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isPublic ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Private
              </button>
              <button 
                onClick={() => setIsPublic(true)}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isPublic ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Public
              </button>
           </div>
        </section>

        {/* Faculty Assignment */}
        <section className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
           <div className="flex items-center gap-3 mb-8">
              <UserPlus size={20} className="text-blue-600" />
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Faculty Intelligence</h3>
           </div>
           
           <div className="relative group">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Assign Primary Instructor</label>
              {loading ? (
                 <div className="h-16 w-full bg-slate-50 animate-pulse rounded-2xl flex items-center px-6">
                    <Loader2 size={18} className="animate-spin text-blue-600 mr-3" />
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Querying Faculty Database...</span>
                 </div>
              ) : (
                <div className="relative">
                   <select 
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 h-16 text-slate-900 font-black focus:bg-white focus:border-blue-600 transition-all outline-none appearance-none cursor-pointer"
                     value={selectedTeacher}
                     onChange={(e) => setSelectedTeacher(e.target.value)}
                   >
                     <option value="" disabled>Select a teacher...</option>
                     {teachers.map(t => (
                       <option key={t._id} value={t._id}>{t.name} — {t.email}</option>
                     ))}
                   </select>
                   <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight size={20} className="rotate-90" />
                   </div>
                </div>
              )}
              <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                 <AlertCircle size={16} className="text-blue-600 mt-0.5" />
                 <p className="text-xs font-medium text-blue-800 leading-relaxed">
                   Assigned instructors will have full administrative control over curriculum, grading, and student management for this course workspace.
                 </p>
              </div>
           </div>
        </section>

        {/* Capacity & Quota */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <Users size={18} className="text-blue-600" />
                 <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Class Capacity</h3>
              </div>
              <input 
                type="number" 
                placeholder="Unlimited"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 h-16 text-slate-900 font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
              />
              <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Maximum number of students permitted to enroll.
              </p>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <Target size={18} className="text-blue-600" />
                 <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Grading Scheme</h3>
              </div>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 h-16 text-slate-900 font-black focus:bg-white focus:border-blue-600 transition-all outline-none appearance-none">
                 <option>Standard Academic (A-F)</option>
                 <option>Pass / Fail</option>
                 <option>Percentage Based</option>
              </select>
              <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Primary evaluation logic for this program.
              </p>
           </div>
        </section>

      </div>
    </div>
  );
}
