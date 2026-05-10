'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/axiosInstance';
import { 
  FileText, Clock, ChevronRight, Plus, 
  Search, Filter, Sparkles, HelpCircle,
  AlertCircle, CheckCircle2, Calendar, 
  BarChart3, Loader2, Play, Star, ArrowRight,
  X, Save, Trash2, Globe, Lock
} from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  duration: number; 
  totalMarks: number;
  startTime: string;
  endTime: string;
  isPublished: boolean;
  status: 'draft' | 'published' | 'closed';
}

const getStatusMeta = (quiz: Quiz) => {
  const now = new Date();
  const start = new Date(quiz.startTime);
  const end = new Date(quiz.endTime);
  
  if (!quiz.isPublished) return { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  if (now < start) return { label: 'Upcoming', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' };
  if (now > end) return { label: 'Ended', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
  return { label: 'Live 🔴', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' };
};

export default function QuizzesPage() {
  const { courseId } = useParams() as { courseId: string };
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
  
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchQuizzes = useCallback(() => {
    setLoading(true);
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
      await courseApi.createQuiz(courseId, form);
      fetchQuizzes();
      setShowForm(false);
      setForm({ title: '', description: '', duration: 30, startTime: '', endTime: '', totalMarks: 20 });
      showToast('Assessment created successfully!');
    } catch (err) {
      const error = err as AxiosError<{message: string}>;
      showToast(error.response?.data?.message || 'Failed to create assessment.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (quizId: string) => {
    try {
      await api.patch(`/api/quizzes/${quizId}/publish`);
      setQuizzes(p => p.map(q => q._id === quizId ? { ...q, isPublished: true } : q));
      showToast('Quiz published to students!');
    } catch (err) {
      showToast('Failed to publish quiz.', 'error');
    }
  };

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto p-4 lg:p-0">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-8 left-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl border flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <HelpCircle size={14} />
            Academic Assessments
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6"
          >
            Quizzes & <span className="text-blue-600">Exams.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed"
          >
            Manage and participate in course assessments. Track your progress and view detailed feedback.
          </motion.p>
        </div>

        {user?.role === 'teacher' && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowForm(p => !p)}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest ${
              showForm 
                ? 'bg-white border border-slate-200 text-slate-600' 
                : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
            }`}
          >
            {showForm ? 'Cancel' : <><Plus size={20} strokeWidth={3} /> Create Quiz</>}
          </motion.button>
        )}
      </header>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 48 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[32px] border-2 border-blue-100 p-8 lg:p-10 shadow-xl shadow-blue-900/5">
              <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Configure Assessment</h3>
              <form onSubmit={handleCreate}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Quiz Title *</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold" placeholder="e.g. Midterm Examination" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Total Marks *</label>
                    <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold" value={form.totalMarks} onChange={e => setForm({...form, totalMarks: parseInt(e.target.value)})} required />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Description</label>
                    <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-medium resize-none" placeholder="Provide instructions or scope..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Duration (mins) *</label>
                    <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold" value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Start Time *</label>
                    <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">End Time *</label>
                    <input type="datetime-local" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-bold" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} required />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="submit" disabled={creating} className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                    {creating ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    Create Assessment
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-10 h-14 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by quiz title..."
            className="w-full bg-white border border-slate-200 text-slate-900 pl-14 pr-6 h-16 rounded-2xl focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="h-16 px-8 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black flex items-center gap-3 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest text-xs">
          <Filter size={18} /> Filters
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 rounded-[32px] bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] border border-slate-200 p-20 text-center shadow-sm"
        >
          <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner">
            <HelpCircle size={48} className="text-blue-600/20" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">No assessments found.</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
            There are currently no quizzes or exams scheduled for this course. Check back later!
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuizzes.map((quiz, i) => {
            const meta = getStatusMeta(quiz);
            const now = new Date();
            const canAttempt = user?.role === 'student' && quiz.isPublished && now >= new Date(quiz.startTime) && now <= new Date(quiz.endTime);

            return (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-white rounded-[32px] border border-slate-200 p-8 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    canAttempt ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <FileText size={28} />
                  </div>
                  <div className="flex gap-2">
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${meta.bg} ${meta.text} ${meta.border}`}>
                       {meta.label}
                     </span>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                  {quiz.title}
                </h3>
                <p className="text-slate-500 font-medium line-clamp-2 mb-8 text-sm leading-relaxed">
                  {quiz.description || 'No description provided for this assessment.'}
                </p>

                <div className="grid grid-cols-2 gap-6 mb-8 pt-8 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Duration</p>
                      <p className="text-sm font-black text-slate-900 leading-none">{quiz.duration} min</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <Star size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Points</p>
                      <p className="text-sm font-black text-slate-900 leading-none">{quiz.totalMarks} pts</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {new Date(quiz.startTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {user?.role === 'teacher' && !quiz.isPublished && (
                      <button onClick={() => handlePublish(quiz._id)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-black text-xs hover:bg-emerald-100 transition-all uppercase tracking-widest">
                        Publish
                      </button>
                    )}
                    <Link 
                      href={`/courses/${courseId}/quizzes/${quiz._id}`}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest group/btn ${
                        canAttempt ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {user?.role === 'student' ? (canAttempt ? 'Start Quiz' : 'View Details') : 'Manage'} <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
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
