'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import { 
  Settings, Save, Trash2, AlertTriangle, 
  CheckCircle2, Loader2, ArrowLeft, 
  ShieldAlert, Info, Globe, Lock
} from 'lucide-react';
import { AxiosError } from 'axios';

export default function CourseSettingsPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const { user } = useAuth();
  
  const [form, setForm] = useState({
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
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (courseId) {
      courseApi.getOne(courseId)
        .then(res => {
          const c = res.data.data;
          // Verify ownership
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
      showToast('Settings updated successfully!');
    } catch (err) {
      const error = err as AxiosError<{message: string}>;
      showToast(error.response?.data?.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you absolutely sure? This will permanently delete the course and all its data.')) return;
    setDeleting(true);
    try {
      await courseApi.delete(courseId);
      router.push('/courses');
    } catch (err) {
      const error = err as AxiosError<{message: string}>;
      showToast(error.response?.data?.message || 'Failed to delete course', 'error');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Toast */}
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}
          className={`fixed top-8 left-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl border flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </motion.div>
      )}

      <header className="mb-12">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Settings size={24} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Course <span className="text-blue-600">Settings.</span></h1>
        </div>
        <p className="text-slate-500 font-medium text-lg">Manage your workspace configuration, visibility, and academic details.</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        
        {/* General Settings */}
        <section className="bg-white rounded-[32px] border border-slate-200 p-8 lg:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Info size={20} className="text-blue-600" />
            <h2 className="text-xl font-black text-slate-900">General Information</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="settings-title" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Course Title</label>
                <input 
                  id="settings-title"
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label htmlFor="settings-code" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Course Code</label>
                <input 
                  id="settings-code"
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold"
                  value={form.code}
                  onChange={e => setForm({...form, code: e.target.value})}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="settings-desc" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Description</label>
                <textarea 
                  id="settings-desc"
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-medium resize-none"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="settings-semester" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Semester</label>
                <select 
                  id="settings-semester"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                  value={form.semester}
                  onChange={e => setForm({...form, semester: e.target.value})}
                >
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Summer Session</option>
                </select>
              </div>
              <div>
                <label htmlFor="settings-academic-year" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Academic Year</label>
                <input 
                  id="settings-academic-year"
                  type="text" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold"
                  value={form.academicYear}
                  onChange={e => setForm({...form, academicYear: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="flex items-center gap-3 px-10 h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
              >
                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* Status & Visibility */}
        <section className="bg-white rounded-[32px] border border-slate-200 p-8 lg:p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Globe size={20} className="text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">Visibility & Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['active', 'draft', 'archived'].map((s) => (
              <button
                key={s}
                onClick={() => setForm({...form, status: s})}
                className={`p-6 rounded-3xl border-2 transition-all text-left flex flex-col gap-3 ${
                  form.status === s 
                    ? 'border-blue-600 bg-blue-50/50' 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  s === 'active' ? 'bg-emerald-100 text-emerald-600' : 
                  s === 'draft' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'
                }`}>
                  {s === 'active' ? <Globe size={20} /> : s === 'draft' ? <Lock size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">{s}</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {s === 'active' ? 'Publicly visible and open for enrollment.' : 
                     s === 'draft' ? 'Hidden from students while you build content.' : 
                     'Read-only mode for historical record keeping.'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-rose-50 rounded-[32px] border border-rose-100 p-8 lg:p-10">
          <div className="flex items-center gap-3 mb-6 text-rose-600">
            <ShieldAlert size={24} />
            <h2 className="text-xl font-black uppercase tracking-tight">Danger Zone</h2>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/50 backdrop-blur-sm rounded-[24px] p-8 border border-rose-200">
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Delete this course</h3>
              <p className="text-slate-500 font-medium max-w-md">
                Once you delete a course, there is no going back. Please be certain.
              </p>
            </div>
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-3 px-8 h-14 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-700 shadow-xl shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm shrink-0"
            >
              {deleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
              Delete Permanently
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
