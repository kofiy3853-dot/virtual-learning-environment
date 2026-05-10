'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { adminApi } from '@/utils/api/adminApi';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, BookOpen, Plus, Save, 
  UserPlus, Info, CheckCircle2, AlertTriangle, Loader2 
} from 'lucide-react';
import { AxiosError } from 'axios';
import Sidebar from '@/components/shared/Sidebar';

interface Teacher {
  _id: string;
  name: string;
  email: string;
}

export default function NewCoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    title: '',
    code: '',
    description: '',
    semester: 'Semester 1',
    academicYear: '2025/2026',
    teacher: '' // Assigned teacher ID
  });
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    adminApi.getAllUsers({ role: 'teacher', limit: 100 })
      .then(res => setTeachers(res.data.data || []))
      .catch(() => setTeachers([]))
      .finally(() => setLoadingTeachers(false));
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacher) {
      showToast('Please assign a teacher to this course.', 'error');
      return;
    }
    
    setCreating(true);
    try {
      await courseApi.create(form);
      showToast('Course created and assigned successfully!');
      setTimeout(() => router.push('/admin/courses'), 1500);
    } catch (err) {
      const error = err as AxiosError<{message: string}>;
      showToast(error.response?.data?.message || 'Failed to create course.', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />
      
      {/* Toast */}
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }}
          className={`fixed top-8 left-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl border flex items-center gap-2 ${
            toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </motion.div>
      )}

      <main className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth">
        <div className="max-w-4xl mx-auto">
          
          <header className="mb-12">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Back to Management
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                <Plus size={24} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">New <span className="text-blue-600">Course.</span></h1>
            </div>
            <p className="text-slate-500 font-medium text-lg">Initialize a new academic program and assign an expert instructor.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Core Details */}
            <section className="bg-white rounded-[32px] border border-slate-200 p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <Info size={20} className="text-blue-600" />
                <h2 className="text-xl font-black text-slate-900">Program Identity</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="course-title" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Course Title</label>
                  <input 
                    id="course-title"
                    type="text" 
                    placeholder="e.g. Advanced Quantum Mechanics"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold"
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="course-code" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Course Code</label>
                  <input 
                    id="course-code"
                    type="text" 
                    placeholder="e.g. PHYS402"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold"
                    value={form.code}
                    onChange={e => setForm({...form, code: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="academic-year" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Academic Year</label>
                  <input 
                    id="academic-year"
                    type="text" 
                    placeholder="2025/2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold"
                    value={form.academicYear}
                    onChange={e => setForm({...form, academicYear: e.target.value})}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="course-desc" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Description</label>
                  <textarea 
                    id="course-desc"
                    rows={4}
                    placeholder="Describe the learning objectives and course scope..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-medium resize-none"
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* Instruction Assignment */}
            <section className="bg-white rounded-[32px] border border-slate-200 p-8 lg:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <UserPlus size={20} className="text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900">Faculty Assignment</h2>
              </div>
              
              <div className="relative">
                <label htmlFor="teacher-assignment" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Assign Instructor</label>
                <select 
                  id="teacher-assignment"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold appearance-none cursor-pointer"
                  value={form.teacher}
                  onChange={e => setForm({...form, teacher: e.target.value})}
                  required
                >
                  <option value="" disabled>Select a teacher...</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
                <div className="absolute bottom-5 right-5 pointer-events-none text-slate-400 font-bold">▼</div>
                {loadingTeachers && <p className="mt-2 text-xs text-blue-600 font-bold animate-pulse">Loading available faculty...</p>}
              </div>
            </section>

            <div className="flex justify-end gap-4">
              <button 
                type="button"
                onClick={() => router.back()}
                className="px-10 h-16 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={creating}
                className="flex items-center justify-center gap-3 px-12 h-16 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
              >
                {creating ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                Create Program
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}
