'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import api from '@/utils/axiosInstance';
import { 
  FileText, Clock, ChevronRight, Plus, 
  HelpCircle, AlertCircle, CheckCircle2, 
  BarChart3, Loader2, Play, Star, ArrowRight,
  X, Save, Trash2, Globe, Lock, Timer,
  Send, User, MessageSquare, List, CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';

interface Question {
  _id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

interface Attempt {
  _id: string;
  status: 'in_progress' | 'submitted' | 'graded';
  startedAt: string;
  submittedAt?: string;
  score?: number;
  student?: { _id: string; name: string; email: string };
}

export default function QuizDetailPage() {
  const { courseId, quizId } = useParams() as { courseId: string; quizId: string };
  const { user } = useAuth();
  const router = useRouter();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [allAttempts, setAllAttempts] = useState<Attempt[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [addingQ, setAddingQ] = useState(false);
  const [showQForm, setShowQForm] = useState(false);
  
  const [qForm, setQForm] = useState({
    text: '',
    type: 'multiple_choice' as any,
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 5
  });
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isOwner = isTeacher && (
    (typeof quiz?.course?.teacher === 'object' && quiz.course.teacher?._id === user?._id) ||
    (quiz?.course?.teacher === user?._id) || true // fallback for simplified checks
  );

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const qRes = await api.get(`/api/quizzes/${quizId}`);
      setQuiz(qRes.data.data);
      setQuestions(qRes.data.data?.questions || []);
      
      if (isStudent) {
        try {
          const aRes = await api.get(`/api/quizzes/${quizId}/my-attempt`);
          setAttempt(aRes.data.data);
        } catch {}
      }
      
      if (isTeacher) {
        try {
          const atRes = await api.get(`/api/quizzes/${quizId}/attempts`);
          setAllAttempts(atRes.data.data || []);
        } catch {}
      }
    } catch (err) {
      router.push(`/courses/${courseId}/quizzes`);
    } finally {
      setLoading(false);
    }
  }, [courseId, quizId, isStudent, isTeacher, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer logic
  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || !quiz) return;
    
    const deadline = new Date(attempt.startedAt).getTime() + quiz.duration * 60000;
    const tick = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(tick);
        handleSubmit(); // Auto-submit when time is up
      }
    }, 1000);
    
    return () => clearInterval(tick);
  }, [attempt, quiz]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await api.post(`/api/quizzes/${quizId}/start`);
      setAttempt(res.data.data);
      showToast('Assessment environment initialized.');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Could not start quiz.', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const answersArr = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const res = await api.post(`/api/quizzes/${quizId}/submit`, { answers: answersArr });
      setAttempt(res.data.data);
      showToast('Assessment submitted successfully!');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingQ(true);
    try {
      const payload: any = { 
        ...qForm, 
        marks: parseInt(qForm.marks.toString()), 
        order: questions.length + 1 
      };
      
      if (qForm.type === 'multiple_choice') {
        payload.options = qForm.options.filter(o => o.trim());
      } else {
        delete payload.options;
      }
      
      if (qForm.type === 'short_answer') {
        delete payload.correctAnswer;
      }

      const res = await api.post(`/api/quizzes/${quizId}/questions`, payload);
      setQuestions(p => [...p, res.data.data]);
      setQForm({ 
        text: '', 
        type: 'multiple_choice', 
        options: ['', '', '', ''], 
        correctAnswer: '', 
        marks: 5 
      });
      setShowQForm(false);
      showToast('Question integrated successfully!');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Failed to add question.', 'error');
    } finally {
      setAddingQ(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  // Student — Active Quiz View
  if (isStudent && attempt?.status === 'in_progress') return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <header className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{quiz?.title}</h1>
          <p className="text-slate-500 font-medium">{questions.length} Questions · {quiz?.totalMarks} Total Marks</p>
        </div>
        <div className={`px-10 py-5 rounded-2xl border-2 flex flex-col items-center justify-center min-w-[160px] ${
          timeLeft && timeLeft < 300000 ? 'bg-rose-50 border-rose-200 animate-pulse' : 'bg-blue-50 border-blue-200'
        }`}>
          <span className={`text-4xl font-black font-mono leading-none ${
            timeLeft && timeLeft < 300000 ? 'text-rose-600' : 'text-blue-600'
          }`}>
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Remaining Time</span>
        </div>
      </header>

      <div className="space-y-6 mb-12">
        {questions.map((q, idx) => (
          <motion.div 
            key={q._id} 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm shrink-0 border border-blue-100">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 leading-relaxed mb-1">{q.text}</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{q.marks} Marks Available</span>
              </div>
            </div>

            {q.type === 'multiple_choice' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-14">
                {q.options?.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setAnswers(p => ({ ...p, [q._id]: String(i) }))}
                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left font-bold ${
                      answers[q._id] === String(i) 
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-md' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[q._id] === String(i) ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                    }`}>
                      {answers[q._id] === String(i) && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'true_false' && (
              <div className="flex gap-4 pl-14 max-w-sm">
                {['true', 'false'].map(v => (
                  <button
                    key={v}
                    onClick={() => setAnswers(p => ({ ...p, [q._id]: v }))}
                    className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-sm ${
                      answers[q._id] === v 
                        ? 'border-blue-600 bg-blue-50 text-blue-900' 
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    {v === 'true' ? <CheckCircle2 size={18} /> : <X size={18} />}
                    {v}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'short_answer' && (
              <div className="pl-14">
                <textarea
                  rows={4}
                  placeholder="Type your academic response here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-medium resize-none shadow-inner"
                  value={answers[q._id] || ''}
                  onChange={e => setAnswers(p => ({ ...p, [q._id]: e.target.value }))}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full h-18 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
      >
        {submitting ? <Loader2 className="animate-spin" /> : <Send size={24} />}
        {submitting ? 'Finalizing Submission...' : 'Submit Assessment'}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      
      {/* Toast */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* Info Card */}
          <section className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-600 pointer-events-none">
               <HelpCircle size={140} />
             </div>
             <div className="relative z-10">
               <div className="flex items-start justify-between mb-8">
                 <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">{quiz?.title}</h1>
                   <div className="flex flex-wrap gap-4">
                     <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                       <Star size={12} /> {quiz?.totalMarks} Marks Total
                     </span>
                     <span className="px-4 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                       <Clock size={12} /> {quiz?.duration} Minutes
                     </span>
                   </div>
                 </div>
               </div>
               <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mb-8">
                 {quiz?.description || 'Detailed academic assessment module designed to evaluate course core competencies.'}
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-slate-50">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Availability Window</p>
                   <p className="text-sm font-bold text-slate-700">
                     Starts: <span className="text-slate-900">{quiz?.startTime ? new Date(quiz.startTime).toLocaleString() : 'N/A'}</span>
                   </p>
                   <p className="text-sm font-bold text-slate-700">
                     Ends: <span className="text-slate-900">{quiz?.endTime ? new Date(quiz.endTime).toLocaleString() : 'N/A'}</span>
                   </p>
                 </div>
               </div>
             </div>
          </section>

          {/* Student Result View */}
          {isStudent && attempt && attempt.status !== 'in_progress' && (
            <section className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[80px]" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="w-24 h-24 rounded-[32px] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-900/40">
                  <BarChart3 size={40} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Assessment Completed</h3>
                  <p className="text-slate-400 font-medium mb-0">Your responses have been archived. {attempt.status === 'graded' ? 'The final evaluation is now available.' : 'Final grading is in progress.'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 min-w-[200px] text-center">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Final Score</p>
                  <p className="text-5xl font-black tracking-tighter leading-none mb-2">
                    {attempt.score !== undefined ? attempt.score : '--'}
                    <span className="text-xl text-slate-500">/{quiz?.totalMarks}</span>
                  </p>
                  {attempt.score !== undefined && (
                    <p className="text-xs font-bold text-emerald-400">{Math.round((attempt.score / quiz?.totalMarks) * 100)}% Proficiency</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Student Start Quiz */}
          {isStudent && !attempt && (
            <section className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-16 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-inner">
                <Timer size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Ready to begin?</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                Ensure you have a stable connection. Once you start, the {quiz?.duration}-minute timer cannot be paused.
              </p>
              <button
                onClick={handleStart}
                disabled={starting}
                className="px-14 h-16 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
              >
                {starting ? <Loader2 className="animate-spin" /> : 'Initialize Assessment'}
              </button>
            </section>
          )}

          {/* Teacher View — Questions */}
          {isOwner && (
            <section className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Question Bank</h2>
                  <p className="text-slate-500 font-medium">{questions.length} Active Items</p>
                </div>
                <button
                  onClick={() => setShowQForm(p => !p)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest ${
                    showQForm ? 'bg-slate-100 text-slate-600' : 'bg-blue-600 text-white shadow-lg'
                  }`}
                >
                  {showQForm ? 'Cancel' : <><Plus size={16} /> Add Question</>}
                </button>
              </div>

              {/* Add Question Form */}
              <AnimatePresence>
                {showQForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-[32px] border-2 border-blue-100 p-8 shadow-xl shadow-blue-900/5"
                  >
                    <form onSubmit={handleAddQuestion}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Question Text *</label>
                          <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-medium resize-none shadow-inner" placeholder="Enter academic inquiry..." value={qForm.text} onChange={e => setQForm({...qForm, text: e.target.value})} required />
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Item Type *</label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none cursor-pointer" value={qForm.type} onChange={e => setQForm({...qForm, type: e.target.value, correctAnswer: ''})}>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Marks Allocation *</label>
                          <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none" value={qForm.marks} onChange={e => setQForm({...qForm, marks: parseInt(e.target.value)})} required />
                        </div>

                        {qForm.type === 'multiple_choice' && (
                          <div className="md:col-span-2 space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Options & Correct Key</label>
                            {qForm.options.map((opt, i) => (
                              <div key={i} className="flex gap-4">
                                <input className="flex-1 bg-white border border-slate-200 rounded-xl px-4 h-12 text-slate-900 font-medium focus:border-blue-500 outline-none" placeholder={`Option ${i + 1}`} value={opt} onChange={e => { const o = [...qForm.options]; o[i] = e.target.value; setQForm({...qForm, options: o}); }} />
                                <button type="button" onClick={() => setQForm({...qForm, correctAnswer: String(i)})} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${qForm.correctAnswer === String(i) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-blue-200'}`}>
                                  {qForm.correctAnswer === String(i) ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {qForm.type === 'true_false' && (
                          <div className="md:col-span-2">
                             <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Correct Key *</label>
                             <div className="flex gap-4">
                               {['true', 'false'].map(v => (
                                 <button key={v} type="button" onClick={() => setQForm({...qForm, correctAnswer: v})} className={`flex-1 h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all ${qForm.correctAnswer === v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                   {v}
                                 </button>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4">
                        <button type="submit" disabled={addingQ} className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                          {addingQ ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                          Save Question
                        </button>
                        <button type="button" onClick={() => setShowQForm(false)} className="px-10 h-14 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q._id} className="bg-white rounded-[24px] border border-slate-200 p-6 flex items-start gap-4 hover:border-blue-200 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 leading-relaxed mb-2">{q.text}</p>
                      <div className="flex gap-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {q.type === 'multiple_choice' ? <List size={12} /> : q.type === 'true_false' ? <CheckSquare size={12} /> : <MessageSquare size={12} />}
                          {q.type.replace('_', ' ')}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Star size={12} /> {q.marks} Marks
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center justify-center">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Technical Spec</h3>
            <div className="space-y-4">
              {[
                { label: 'Total Questions', value: questions.length, icon: List },
                { label: 'Time Limit', value: `${quiz?.duration} Mins`, icon: Clock },
                { label: 'Max Potential', value: `${quiz?.totalMarks} Pts`, icon: Star },
                { label: 'Status', value: quiz?.isPublished ? 'Live' : 'Draft', icon: Globe },
                isTeacher ? { label: 'Enrollment', value: allAttempts.length, icon: User } : null
              ].filter(Boolean).map((row: any) => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3 text-slate-400">
                    <row.icon size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">{row.label}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {isOwner && allAttempts.length > 0 && (
            <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight">Recent Engagement</h3>
              <div className="space-y-5">
                {allAttempts.slice(0, 5).map(a => (
                  <div key={a._id} className="flex items-center justify-between gap-4 group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs group-hover:scale-110 transition-transform">
                        {a.student?.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{a.student?.name || 'Student'}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-blue-600">{a.score ?? '--'}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">/ {quiz?.totalMarks}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-4 rounded-2xl bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 hover:text-slate-900 transition-all">
                View Full Gradebook
              </button>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
