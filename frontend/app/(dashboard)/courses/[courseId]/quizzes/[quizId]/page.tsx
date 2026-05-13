'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api/axiosInstance';
import ImmersiveQuizPlayer from '@/components/learning/ImmersiveQuizPlayer';
import { 
  Sparkles, Star, Clock, Play, Loader2, 
  CheckCircle2, Plus, Trash2, List, AlertCircle,
  Shield, Target, Zap, ChevronLeft, ArrowRight,
  TrendingUp, Users, Brain
} from 'lucide-react';
import Link from 'next/link';
import { Quiz, Course } from '@/types';
import DashboardLayout from '@/layouts/DashboardLayout';

interface Question {
  _id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  marks: number;
}

interface Attempt {
  _id: string;
  status: 'in_progress' | 'completed';
  startedAt: string;
  score?: number;
  student?: {
    _id: string;
    name: string;
  };
}

export default function QuizDetailPage() {
  const { courseId, quizId } = useParams() as { courseId: string; quizId: string };
  const { user } = useAuth();
  const router = useRouter();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [allAttempts, setAllAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQForm, setShowQForm] = useState(false);
  const autoOpened = useRef(false);
  const [addingQ, setAddingQ] = useState(false);
  
  const [qForm, setQForm] = useState({
    text: '',
    type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 5
  });
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';
  const courseData = quiz?.course as Course | undefined;
  const teacherId = typeof courseData?.teacher === 'object' ? courseData.teacher._id : courseData?.teacher;
  const isOwner = isTeacher && (teacherId === user?._id || user?.role === 'admin');

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const qRes = await api.get(`/api/quizzes/${quizId}`);
        const quizData = qRes.data.data;
        setQuiz(quizData);
        const qList = quizData?.questions || [];
        setQuestions(qList);
        
        // Auto-open question form if teacher arrives with no questions (fresh quiz)
        if (user?.role === 'teacher' && qList.length === 0 && !autoOpened.current) {
          setShowQForm(true);
          autoOpened.current = true;
        }
        
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
    };

    loadData();
  }, [courseId, quizId, isStudent, isTeacher, router, user]);
  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await api.post(`/api/quizzes/${quizId}/start`);
      setAttempt(res.data.data);
      showToast('Assessment protocols initialized.');
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Initialization failed.', 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleFinalSubmit = useCallback(async (answers: Record<string, string>) => {
    setSubmitting(true);
    try {
      const answersArr = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const res = await api.post(`/api/quizzes/${quizId}/submit`, { answers: answersArr });
      setAttempt(res.data.data);
      showToast('Assessment synchronized and stored.');
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Transmission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [quizId]);


  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || !quiz) return;
    
    const deadline = new Date(attempt.startedAt).getTime() + quiz.duration * 60000;
    const tick = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(tick);
        handleFinalSubmit({}); // Auto-submit empty if needed
      }
    }, 1000);
    
    return () => clearInterval(tick);
  }, [attempt, quiz, handleFinalSubmit]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingQ(true);
    try {
      const payload: Record<string, unknown> = { 
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
      setShowQForm(false);
      setQForm({ text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', marks: 5 });
      showToast('Intelligence item integrated.');
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message || 'Integration failed.', 'error');
    } finally {
      setAddingQ(false);
    }
  };

  if (loading || !quiz) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching Protocol Data...</p>
      </div>
    </div>
  );

  // STUDENT — ACTIVE MODE
  if (isStudent && attempt?.status === 'in_progress') {
    return (
      <ImmersiveQuizPlayer 
        quiz={quiz} 
        questions={questions} 
        attempt={attempt} 
        onSubmit={handleFinalSubmit}
        timeLeft={timeLeft}
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-12 pb-20">
        
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
              className={`fixed top-8 left-1/2 z-[100] px-8 py-4 rounded-2xl font-black shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${
                toast.type === 'error' ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-900 text-white border-slate-800'
              }`}
            >
              {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} className="text-primary-400" />}
              <span className="text-sm tracking-tight">{toast.msg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 space-y-12">
            {/* Header section */}
            <section className="bg-white rounded-[40px] border border-slate-100 p-10 relative overflow-hidden group shadow-sm">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <Link href={`/courses/${courseId}/quizzes`} className="flex items-center gap-2 text-slate-400 hover:text-primary-500 transition-colors text-[10px] font-black uppercase tracking-widest group/back">
                      <ChevronLeft size={16} className="group-hover/back:-translate-x-1 transition-transform" /> Back to Evaluation Hub
                    </Link>
                    <div className="flex items-center gap-2 text-primary-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      <Sparkles size={14} /> Mission Specification
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-none">{quiz?.title}</h1>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
                      {quiz?.description || 'Strategic academic evaluation module designed to measure core competency proficiency across standardized performance metrics.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <Target size={16} className="text-primary-500" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{quiz?.totalMarks} Marks Yield</span>
                    </div>
                    <div className="px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <Clock size={16} className="text-primary-500" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">{quiz?.duration} Min Threshold</span>
                    </div>
                  </div>
               </div>
            </section>

            {/* Student View: Launchpad or Results */}
            {isStudent && (
              <>
                {!attempt ? (
                  <section className="bg-slate-900 rounded-[40px] p-16 text-center text-white shadow-2xl relative overflow-hidden border border-slate-800">
                     <div className="absolute inset-0 bg-primary-500/5" />
                     <div className="relative z-10 max-w-md mx-auto space-y-10">
                        <div className="w-24 h-24 bg-primary-500 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-primary-500/20">
                           <Play size={40} className="text-white fill-white ml-2" />
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-3xl font-display font-extrabold tracking-tight">Initialize Protocol.</h2>
                          <p className="text-slate-400 font-medium leading-relaxed">
                            The evaluation environment is locked and ready. Once initialized, the temporal threshold will be strictly enforced.
                          </p>
                        </div>
                        <button
                          onClick={handleStart}
                          disabled={starting}
                          className="btn btn-primary w-full h-18 text-xl font-display font-black shadow-xl shadow-primary-500/20 gap-4 uppercase tracking-[0.2em]"
                        >
                          {starting ? <Loader2 className="animate-spin" /> : <Shield size={24} />}
                          {starting ? 'Syncing...' : 'Launch Assessment'}
                        </button>
                     </div>
                  </section>
                ) : (
                  <section className="bg-white rounded-[40px] border border-slate-100 p-12 shadow-sm text-center">
                     <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[28px] flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 size={40} />
                     </div>
                     <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight mb-4">Transmission Archived.</h2>
                     <p className="text-slate-500 font-medium mb-12">Your responses have been successfully indexed and archived in the portal.</p>
                     
                     <div className="relative inline-block">
                       <div className="absolute -inset-4 bg-primary-500/10 blur-2xl rounded-full opacity-50" />
                       <div className="bg-slate-900 rounded-[40px] p-12 w-[320px] relative border border-slate-800">
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Yield Proficiency</p>
                          <p className="text-7xl font-display font-black text-white tracking-tighter">
                            {attempt.score !== undefined ? attempt.score : '--'}
                            <span className="text-2xl text-slate-700 ml-2">/{quiz?.totalMarks}</span>
                          </p>
                          {attempt.score !== undefined && (
                            <div className="mt-8 flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-500/10 text-primary-400 text-[10px] font-black uppercase tracking-widest border border-primary-500/20">
                               <TrendingUp size={14} /> {Math.round((attempt.score / quiz?.totalMarks) * 100)}% Accuracy Index
                            </div>
                          )}
                       </div>
                     </div>
                  </section>
                )}
              </>
            )}

            {/* Teacher View: Question Management */}
            {isTeacher && (
              <section className="space-y-10">
                 <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                       <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Intelligence Bank</h2>
                       <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                         <Brain size={14} className="text-primary-500" /> {questions.length} Active Items Indexed
                       </p>
                    </div>
                    <button 
                      onClick={() => setShowQForm(!showQForm)}
                      className="btn btn-primary h-12 px-6 gap-2"
                    >
                       <Plus size={18} /> Add Requirement
                    </button>
                 </div>

                 <AnimatePresence>
                   {showQForm && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-xl overflow-hidden"
                      >
                         <form onSubmit={handleAddQuestion} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="md:col-span-2 space-y-2">
                                  <label htmlFor="q-text" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Instruction Text</label>
                                  <textarea 
                                    id="q-text"
                                    required className="input-premium py-6 min-h-[120px] resize-none" 
                                    placeholder="Enter the assessment query text..."
                                    value={qForm.text} onChange={e => setQForm({...qForm, text: e.target.value})}
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label htmlFor="q-type" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Item Logic</label>
                                  <select 
                                    id="q-type"
                                    className="input-premium h-14 bg-white" 
                                    value={qForm.type} onChange={e => setQForm({...qForm, type: e.target.value as 'multiple_choice' | 'true_false' | 'short_answer'})}
                                  >
                                     <option value="multiple_choice">Multiple Choice</option>
                                     <option value="true_false">True / False</option>
                                     <option value="short_answer">Short Answer</option>
                                  </select>
                               </div>
                               <div className="space-y-2">
                                  <label htmlFor="q-marks" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Yield Weight</label>
                                  <input 
                                    id="q-marks"
                                    type="number" className="input-premium h-14" 
                                    value={qForm.marks} onChange={e => setQForm({...qForm, marks: parseInt(e.target.value)})} 
                                  />
                               </div>

                               {qForm.type === 'multiple_choice' && (
                                 <div className="md:col-span-2 space-y-4">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Options Matrix</label>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {qForm.options.map((opt, i) => (
                                       <div key={i} className="relative group/opt">
                                         <input 
                                           aria-label={`Option ${String.fromCharCode(65 + i)}`}
                                           className={`input-premium h-14 pl-14 pr-12 transition-all ${qForm.correctAnswer === String(i) ? 'border-primary-500 bg-primary-50/30' : ''}`}
                                           placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                           value={opt}
                                           onChange={e => {
                                             const o = [...qForm.options];
                                             o[i] = e.target.value;
                                             setQForm({...qForm, options: o});
                                           }}
                                         />
                                         <button 
                                           type="button"
                                           aria-label={`Mark Option ${String.fromCharCode(65 + i)} as Correct`}
                                           title={`Mark Option ${String.fromCharCode(65 + i)} as Correct`}
                                           onClick={() => setQForm({...qForm, correctAnswer: String(i)})}
                                           className={`absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                                             qForm.correctAnswer === String(i) ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-100 bg-white text-slate-200 hover:border-primary-200'
                                           }`}
                                         >
                                           {qForm.correctAnswer === String(i) ? <CheckCircle2 size={14} /> : <span className="text-[10px] font-black">{String.fromCharCode(65 + i)}</span>}
                                         </button>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )}

                               {qForm.type === 'true_false' && (
                                 <div className="md:col-span-2 space-y-4">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Truth Calibration</label>
                                   <div className="flex gap-4">
                                      {['true', 'false'].map(val => (
                                        <button 
                                          key={val}
                                          type="button"
                                          onClick={() => setQForm({...qForm, correctAnswer: val})}
                                          className={`flex-1 h-14 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                                            qForm.correctAnswer === val ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-primary-200'
                                          }`}
                                        >
                                          {val}
                                        </button>
                                      ))}
                                   </div>
                                 </div>
                               )}
                            </div>
                            <div className="flex gap-4">
                               <button type="button" onClick={() => setShowQForm(false)} className="btn btn-secondary flex-1 h-14">Cancel</button>
                               <button type="submit" className="btn btn-primary flex-[2] h-14">
                                  {addingQ ? <Loader2 className="animate-spin" /> : 'Integrate Intelligence Item'}
                                </button>
                            </div>
                         </form>
                      </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <motion.div 
                        key={q._id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        className="group bg-white rounded-[32px] border border-slate-100 p-8 flex items-center gap-8 hover:border-primary-200 transition-all shadow-sm"
                      >
                         <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 font-display font-black flex items-center justify-center text-sm group-hover:bg-primary-500 group-hover:text-white transition-all shadow-inner">
                            {idx + 1}
                         </div>
                         <div className="flex-1 space-y-3">
                            <h4 className="text-lg font-bold text-slate-900 leading-snug">{q.text}</h4>
                            <div className="flex gap-3">
                               <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">{q.type.replace('_', ' ')}</span>
                               <span className="px-3 py-1 rounded-lg bg-primary-50 border border-primary-100 text-[9px] font-black uppercase tracking-widest text-primary-600">{q.marks} Pts</span>
                            </div>
                         </div>
                         <button 
                           aria-label={`Delete question: ${q.text.substring(0, 20)}`}
                           title="Delete Question"
                           className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100"
                         >
                            <Trash2 size={18} />
                         </button>
                      </motion.div>
                    ))}
                 </div>
              </section>
            )}
          </div>

          {/* Sidebar Controls */}
          <aside className="lg:col-span-4 space-y-8">
             <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Protocol Matrix</h3>
                <div className="space-y-6">
                   <TechnicalRow icon={<List size={16} />} label="Indexed Items" value={questions.length} />
                   <TechnicalRow icon={<Clock size={16} />} label="Time Threshold" value={`${quiz?.duration}m`} />
                   <TechnicalRow icon={<Target size={16} />} label="Max Yield" value={quiz?.totalMarks} />
                   <TechnicalRow icon={<Zap size={16} />} label="System State" value={quiz?.isPublished ? 'Live' : 'Draft'} color={quiz?.isPublished ? 'text-emerald-500' : 'text-amber-500'} />
                </div>
             </div>

             {isTeacher && allAttempts.length > 0 && (
                <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                   <div className="flex items-center justify-between mb-8 relative z-10">
                     <h3 className="text-xs font-black text-primary-400 uppercase tracking-widest px-1">Live Telemetry</h3>
                     <Users size={16} className="text-slate-600" />
                   </div>
                   <div className="space-y-6 relative z-10">
                      {allAttempts.slice(0, 5).map((a, idx) => (
                         <div key={a._id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black group-hover:bg-primary-500 transition-all">
                                  {a.student?.name?.charAt(0)}
                               </div>
                               <div className="min-w-0 space-y-0.5">
                                  <p className="text-sm font-bold truncate">{a.student?.name}</p>
                                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{a.status}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-primary-400">{a.score ?? '--'}</p>
                               <p className="text-[8px] font-black text-slate-600 tracking-tighter">/ {quiz?.totalMarks}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                   <button className="w-full mt-10 h-14 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                      View Audit Log <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             )}
          </aside>

        </div>
      </div>
    </DashboardLayout>
  );
}

function TechnicalRow({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 group">
       <div className="flex items-center gap-3 text-slate-400 group-hover:text-primary-500 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all">
            {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <span className={`text-sm font-black ${color || 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

