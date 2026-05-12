'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api/axiosInstance';
import { 
  FileText, Clock, ChevronRight, Plus, 
  Search, Filter, Sparkles, HelpCircle,
  AlertCircle, CheckCircle2, Calendar, 
  BarChart3, Loader2, Play, Star, ArrowRight,
  X, Save, Trash2, Globe, Lock, Target, Zap,
  Activity, ShieldCheck, Cpu, Brain, Timer
} from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  duration: number; 
  totalMarks: number;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  questionCount?: number;
  status: 'draft' | 'published' | 'closed';
}

const getStatusMeta = (quiz: Quiz) => {
  const now = new Date();
  const start = new Date(quiz.startTime);
  const end = new Date(quiz.endTime);
  const noQuestions = quiz.questionCount === 0 || !quiz.questionCount;
  
  if (!quiz.isPublished) return { 
    label: noQuestions ? 'Awaiting Architecture' : 'Protocol Draft', 
    bg: noQuestions ? 'bg-amber-50' : 'bg-slate-50', 
    text: noQuestions ? 'text-amber-600' : 'text-slate-400', 
    border: noQuestions ? 'border-amber-100' : 'border-slate-100', 
    dot: noQuestions ? 'bg-amber-400' : 'bg-slate-300',
    icon: noQuestions ? <AlertCircle size={12} /> : <Lock size={12} />
  };
  if (now < start) return { 
    label: 'Scheduled Transmission', 
    bg: 'bg-primary-50', 
    text: 'text-primary-600', 
    border: 'border-primary-100', 
    dot: 'bg-primary-400',
    icon: <Calendar size={12} />
  };
  if (now > end) return { 
    label: 'Archive State', 
    bg: 'bg-slate-50', 
    text: 'text-slate-500', 
    border: 'border-slate-100', 
    dot: 'bg-slate-400',
    icon: <ShieldCheck size={12} />
  };
  return { 
    label: 'Live Broadcast', 
    bg: 'bg-rose-50', 
    text: 'text-rose-600', 
    border: 'border-rose-100', 
    dot: 'bg-rose-500 animate-pulse',
    icon: <Activity size={12} />
  };
};

export default function QuizzesPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const { user } = useAuth();
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: 30,
    startTime: '',
    endTime: '',
    totalMarks: 20
  });

  const fetchQuizzes = useCallback(() => {
    courseApi.getQuizzes(courseId)
      .then(res => setQuizzes(res.data.data || []))
      .catch(() => setQuizzes([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await courseApi.createQuiz(courseId, form);
      const newQuiz = res.data.data;
      toast.success('Assessment initialized. Redirecting to Question Architect.');
      router.push(`/courses/${courseId}/quizzes/${newQuiz._id}`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Configuration failed.');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (quiz: Quiz) => {
    if (!quiz.questionCount || quiz.questionCount === 0) {
      toast.error('Add at least one question before broadcasting.');
      return;
    }
    try {
      await api.patch(`/api/quizzes/${quiz._id}/publish`);
      setQuizzes(p => p.map(q => q._id === quiz._id ? { ...q, isPublished: true } : q));
      toast.success('Assessment broadcasted to cohort.');
    } catch (err) {
      toast.error('Broadcast failed.');
    }
  };

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
      <div className="space-y-12 pb-20">
        
        {/* Immersive Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 text-primary-500 font-black text-[10px] uppercase tracking-[0.3em]">
              <Brain size={14} />
              Evaluation Portal
            </div>
            <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
              Academic <span className="text-primary-500">Assessments</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
              Synthesize knowledge through high-fidelity evaluations, track algorithmic performance, and unlock cognitive insights.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="relative group w-full sm:w-auto">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
               <input 
                 className="bg-white border border-slate-100 rounded-[24px] pl-16 pr-6 h-16 text-sm font-bold focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all w-full sm:w-80 shadow-sm" 
                 placeholder="Search evaluations..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
             </div>
             {(user?.role === 'teacher' || user?.role === 'admin') && (
               <button 
                 onClick={() => setShowForm(true)}
                 className="btn btn-primary h-16 px-10 gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary-500/20 w-full sm:w-auto"
               >
                 <Plus size={20} strokeWidth={3} /> Post Evaluation
               </button>
             )}
          </div>
        </header>

        {/* Create Assessment Modal Overlay */}
        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                onClick={() => setShowForm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 40 }}
                className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-[64px] shadow-2xl p-12 lg:p-16 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center border border-primary-100 shadow-inner">
                      <Target size={24} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Configure Assessment</h2>
                      <p className="text-sm font-medium text-slate-500">Establish evaluation criteria and timeframes.</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)} aria-label="Close configuration" title="Close configuration" className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-8 relative z-10">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label htmlFor="assessment-title" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Assessment Title</label>
                      <input id="assessment-title" title="Enter assessment title" required className="input-premium h-16 text-lg" placeholder="e.g. Advanced Thermodynamics Final" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label htmlFor="assessment-weight" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Weight (Marks)</label>
                        <input id="assessment-weight" title="Enter assessment weight" type="number" required className="input-premium h-16 text-lg" placeholder="20" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: parseInt(e.target.value)})} />
                      </div>
                      <div className="space-y-3">
                        <label htmlFor="assessment-duration" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Duration (Min)</label>
                        <input id="assessment-duration" title="Enter assessment duration" type="number" required className="input-premium h-16 text-lg" placeholder="30" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label htmlFor="assessment-start" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Start Threshold</label>
                        <input id="assessment-start" title="Enter start threshold" type="datetime-local" required className="input-premium h-16 text-sm" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label htmlFor="assessment-end" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">End Threshold</label>
                        <input id="assessment-end" title="Enter end threshold" type="datetime-local" required className="input-premium h-16 text-sm" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="assessment-scope" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Evaluation Scope</label>
                      <textarea id="assessment-scope" title="Enter evaluation scope" rows={3} className="input-premium py-6 resize-none text-lg" placeholder="Detail the assessment requirements..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="submit" disabled={creating} className="btn btn-primary flex-1 h-16 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20">
                      {creating ? <Loader2 size={20} className="animate-spin mr-2" /> : <><Zap size={18} fill="currentColor" className="mr-2" /> Finalize Configuration</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-80 rounded-[48px] bg-white border border-slate-100 animate-pulse shadow-sm" />)}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="py-40 text-center bg-white rounded-[64px] border border-slate-100 shadow-2xl shadow-primary-500/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="w-28 h-28 bg-slate-50 rounded-[40px] shadow-inner mx-auto flex items-center justify-center mb-10 border border-slate-100 group-hover:scale-110 transition-transform duration-700 relative z-10">
              <Brain size={48} className="text-slate-200" />
            </div>
            <h3 className="text-3xl font-display font-extrabold text-slate-900 mb-3 relative z-10">Intelligence Gap Detected</h3>
            <p className="text-slate-500 font-medium max-w-sm mx-auto mb-12 text-lg relative z-10">The evaluation engine is currently idle. No active assessments detected in this portal.</p>
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <button onClick={() => setShowForm(true)} className="btn btn-primary h-16 px-12 text-[10px] font-black uppercase tracking-widest relative z-10">Initialize First Protocol</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredQuizzes.map((quiz, idx) => {
              const meta = getStatusMeta(quiz);
              const now = new Date();
              const canAttempt = user?.role === 'student' && quiz.isPublished && now >= new Date(quiz.startTime) && now <= new Date(quiz.endTime);

              return (
                <motion.div
                  key={quiz._id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-primary-500/20 blur-[64px] opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
                  <div className="relative bg-white border border-slate-100 rounded-[48px] p-10 flex flex-col justify-between h-full hover:border-primary-500/50 transition-all duration-700 shadow-sm group-hover:shadow-2xl group-hover:shadow-primary-500/10 group-hover:-translate-y-2">
                    <div className="space-y-8">
                      <div className="flex items-start justify-between">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-700 ${
                          canAttempt 
                            ? 'bg-primary-500 text-white border-primary-400 shadow-xl shadow-primary-500/20' 
                            : 'bg-slate-50 text-slate-300 border-slate-100'
                        }`}>
                          <Cpu size={32} />
                        </div>
                        <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm ${meta.bg} ${meta.text} ${meta.border}`}>
                          {meta.icon}
                          {meta.label}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-2xl font-display font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors tracking-tight leading-tight line-clamp-2">{quiz.title}</h3>
                        <p className="text-slate-500 font-medium line-clamp-2 leading-relaxed text-sm">{quiz.description || 'No specialized assessment brief has been provided for this intelligence protocol.'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 py-8 border-t border-slate-50">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Timer size={14} className="text-primary-500" /> Duration
                          </p>
                          <p className="text-lg font-display font-extrabold text-slate-800">{quiz.duration} <span className="text-xs text-slate-400">Min</span></p>
                        </div>
                        <div className="space-y-2 text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 justify-end">
                            <Target size={14} className="text-primary-500" /> Weight
                          </p>
                          <p className="text-lg font-display font-extrabold text-slate-800">{quiz.totalMarks} <span className="text-xs text-slate-400">Pts</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {new Date(quiz.startTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      
                      <div className="flex gap-3">
                        {(user?.role === 'teacher' || user?.role === 'admin') && !quiz.isPublished && (
                          <button 
                            onClick={() => handlePublish(quiz)} 
                            className="h-12 px-6 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            Broadcast
                          </button>
                        )}
                        <Link 
                          href={`/courses/${courseId}/quizzes/${quiz._id}`}
                          className={`h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 ${
                            canAttempt 
                              ? 'btn-primary shadow-xl shadow-primary-500/20' 
                              : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                          }`}
                        >
                          {user?.role === 'student' ? (canAttempt ? 'Launch Engine' : 'View Analytics') : 'Manage Protocol'} 
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
  );
}
