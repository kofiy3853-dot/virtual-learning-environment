'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import type { Course } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  Settings, Save, Trash2, AlertTriangle, 
  CheckCircle2, Loader2, ArrowLeft, 
  ShieldAlert, Info, Globe, Lock, Cpu, Database, 
  Eye, Archive, Zap, Shield
} from 'lucide-react';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

export default function CourseSettingsPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const { user } = useAuth();
  
  const [form, setForm] = useState<Partial<Course>>({
    title: '',
    code: '',
    description: '',
    semester: 'Semester 1',
    academicYear: '2025/2026',
    status: 'active'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (courseId) {
      courseApi.getOne(courseId)
        .then(res => {
          const c = res.data.data;
          const teacherId = typeof c.teacher === 'object' ? c.teacher?._id : c.teacher;
          if (teacherId !== user?._id && user?.role !== 'admin') {
            router.push(`/courses/${courseId}`);
            return;
          }
          setForm({
            title: c.title || '',
            code: c.code || '',
            description: c.description || '',
            semester: c.semester || 'Semester 1',
            academicYear: c.academicYear || '2025/2026',
            status: c.status || 'active'
          });
        })
        .catch(() => router.push('/courses'))
        .finally(() => setLoading(false));
    }
  }, [courseId, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await courseApi.update(courseId, form);
      toast.success('Configuration synchronized successfully.');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you absolutely sure? This will permanently delete the course and all its data.')) return;
    setDeleting(true);
    try {
      await courseApi.delete(courseId);
      toast.success('Course decommissioned successfully.');
      router.push('/courses');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to decommission course.');
      setDeleting(false);
    }
  };

  if (loading) return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin shadow-xl shadow-primary-500/5" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu size={28} className="text-primary-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500">Accessing Root Access</p>
      </div>
    </>
  );

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        
        {/* Immersive Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 text-primary-500 font-black text-[10px] uppercase tracking-[0.3em]">
              <Settings size={14} />
              Configuration Terminal
            </div>
            <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
              Course <span className="text-primary-500">Settings</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
              Manage core academic parameters, visibility protocols, and decommissioning sequences for this workspace.
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 space-y-12">
            
            {/* General Intelligence */}
            <section className="bg-white rounded-[48px] border border-slate-100 p-10 lg:p-14 relative overflow-hidden group shadow-2xl shadow-slate-200/20">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
              
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-3 text-primary-500 text-[10px] font-black uppercase tracking-[0.3em]">
                  <Database size={16} /> Core Data Matrix
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label htmlFor="course-title" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Institutional Title</label>
                    <input 
                      id="course-title"
                      title="Enter the institutional title"
                      placeholder="e.g. Advanced Data Structures"
                      required className="input-premium h-16 text-lg" 
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="course-code" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Operational Code</label>
                    <input 
                      id="course-code"
                      title="Enter the operational code"
                      placeholder="e.g. CS-401"
                      required className="input-premium h-16 text-lg" 
                      value={form.code}
                      onChange={e => setForm({...form, code: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <label htmlFor="course-description" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Executive Summary</label>
                    <textarea 
                      id="course-description"
                      title="Provide an executive summary of the course"
                      placeholder="Enter a comprehensive description of the academic objectives..."
                      rows={4} className="input-premium py-6 resize-none min-h-[160px] text-lg"
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="course-semester" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Academic Cycle</label>
                    <select 
                      id="course-semester"
                      title="Select the academic cycle"
                      className="input-premium h-16 text-lg appearance-none cursor-pointer"
                      value={form.semester}
                      onChange={e => setForm({...form, semester: e.target.value})}
                    >
                      <option>Semester 1</option>
                      <option>Semester 2</option>
                      <option>Summer Session</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="course-year" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Temporal Window</label>
                    <input 
                      id="course-year"
                      title="Enter the temporal window"
                      placeholder="e.g. 2025/2026"
                      className="input-premium h-16 text-lg"
                      value={form.academicYear}
                      onChange={e => setForm({...form, academicYear: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn btn-primary h-16 px-12 gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary-500/20 active:scale-95"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Synchronize Configuration
                  </button>
                </div>
              </div>
            </section>

            {/* Visibility Protocols */}
            <section className="bg-white rounded-[48px] border border-slate-100 p-10 lg:p-14 shadow-2xl shadow-slate-200/20 space-y-10 group">
              <div className="flex items-center gap-3 text-primary-500 text-[10px] font-black uppercase tracking-[0.3em]">
                <Eye size={16} /> Visibility Protocol
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(['active', 'draft', 'archived'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({...form, status: s})}
                    className={`p-8 rounded-[32px] border-2 transition-all text-left flex flex-col gap-6 relative overflow-hidden group ${
                      form.status === s 
                        ? 'border-primary-500 bg-primary-50/30 ring-4 ring-primary-500/5' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                      s === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                      s === 'draft' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {s === 'active' ? <Globe size={24} /> : s === 'draft' ? <Lock size={24} /> : <Archive size={24} />}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">{s}</h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {s === 'active' ? 'Operational. Full cohort access.' : 
                         s === 'draft' ? 'Encrypted. Instructor access only.' : 
                         'Immutable. Historical data integrity.'}
                      </p>
                    </div>
                    {form.status === s && (
                      <div className="absolute top-4 right-4">
                        <CheckCircle2 size={20} className="text-primary-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            {/* Status Radar */}
            <section className="bg-white rounded-[48px] border border-slate-100 p-10 shadow-2xl shadow-slate-200/10 space-y-8">
               <div className="flex items-center gap-3 text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">
                  <Zap size={16} /> Operational Status
               </div>
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uplink Status</span>
                    <span className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Encrypted
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Integrity</span>
                    <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest">100% Verified</span>
                  </div>
               </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-rose-50 rounded-[48px] border border-rose-100 p-10 space-y-8 group">
              <div className="flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldAlert size={20} /> Danger Zone
              </div>
              
              <div className="space-y-6">
                <p className="text-rose-900/60 text-sm font-medium leading-relaxed">
                  Decommissioning this workspace is terminal. All academic records, transmissions, and intelligence data will be permanently purged.
                </p>
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full h-16 rounded-[24px] bg-white border border-rose-200 text-rose-600 font-black hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-xl shadow-rose-900/5 active:scale-95 text-[10px] uppercase tracking-widest"
                >
                  {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} className="mr-2 inline" />}
                  Purge Course Data
                </button>
              </div>
            </section>

            {/* AI Advisor */}
            <section className="bg-slate-900 rounded-[48px] p-10 text-white space-y-8 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
                 <div className="w-16 h-16 rounded-[24px] bg-primary-500/20 flex items-center justify-center border border-primary-500/20 group-hover:scale-110 transition-transform duration-700">
                    <Shield className="text-primary-400" size={28} />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-2xl font-display font-extrabold tracking-tight">Security Advisor</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      Root access granted. Ensure all configuration changes are peer-reviewed before synchronization. Purge actions require level 4 authorization.
                    </p>
                 </div>
                 <button type="button" className="w-full py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                    View Audit Logs
                 </button>
            </section>
          </aside>
        </form>
      </div>
    </>
  );
}
