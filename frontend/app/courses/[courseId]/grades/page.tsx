'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api/axiosInstance';
import { 
  Trophy, Star, Target, TrendingUp, 
  BarChart3, FileText, CheckCircle2, AlertCircle,
  Search, Filter, ChevronRight, ArrowUpRight,
  Loader2, Sparkles, Award, BookOpen, HelpCircle,
  Scale, Save, X, User, ShieldAlert
} from 'lucide-react';
import { AxiosError } from 'axios';

interface GradeItem {
  _id: string;
  sourceId: { title: string };
  sourceType: 'assignment' | 'quiz';
  score: number;
  maxScore: number;
  gradedAt: string;
}

interface GradebookEntry {
  student: { _id: string; name: string; email: string };
  assignmentAverage: number;
  quizAverage: number;
  finalPercentage: number;
}

export default function GradesPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [weights, setWeights] = useState<any>(null);
  const [finalGrade, setFinalGrade] = useState<any>(null);
  const [myGrades, setMyGrades] = useState<GradeItem[]>([]);
  const [gradebook, setGradebook] = useState<GradebookEntry[]>([]);
  const [atRisk, setAtRisk] = useState<GradebookEntry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [wForm, setWForm] = useState({ assignmentWeight: 60, quizWeight: 40 });
  const [savingW, setSavingW] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isOwner = isTeacher && (
    (typeof course?.teacher === 'object' && course.teacher?._id === user?._id) ||
    (course?.teacher === user?._id)
  );

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cRes = await courseApi.getOne(courseId);
      setCourse(cRes.data.data);
      
      try { 
        const wRes = await courseApi.getGradeWeights(courseId); 
        setWeights(wRes.data.data); 
        setWForm({ 
          assignmentWeight: wRes.data.data.assignmentWeight, 
          quizWeight: wRes.data.data.quizWeight 
        }); 
      } catch {}

      if (isStudent) {
        const [gRes, fRes] = await Promise.all([
          api.get(`/api/students/me/grades/${courseId}`),
          api.get(`/api/students/me/grades/${courseId}/final`)
        ]);
        setMyGrades(gRes.data.data || []);
        setFinalGrade(fRes.data.data);
      }

      if (isTeacher) {
        const [gbRes, arRes] = await Promise.all([
          courseApi.getGradebook(courseId),
          courseApi.getAtRisk(courseId)
        ]);
        setGradebook(gbRes.data.data || []);
        setAtRisk(arRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId, isStudent, isTeacher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wForm.assignmentWeight + wForm.quizWeight !== 100) {
      showToast('Weights must add up to exactly 100%.', 'error');
      return;
    }
    setSavingW(true);
    try {
      const res = await courseApi.setGradeWeights(courseId, wForm);
      setWeights(res.data.data);
      setShowWeightForm(false);
      showToast('Academic weights updated successfully!');
    } catch (err) {
      const error = err as AxiosError<{message: string}>;
      showToast(error.response?.data?.message || 'Failed to update weights.', 'error');
    } finally {
      setSavingW(false);
    }
  };

  const getGradeColor = (p: number) => {
    if (p >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (p >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 lg:p-0">
      
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

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <Award size={14} />
            Academic Achievement
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6"
          >
            Performance <span className="text-blue-600">Gradebook.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed"
          >
            {isTeacher ? 'Analyze class-wide performance, manage final grades, and identify at-risk students.' : 'Track your academic journey and final grade projections for this course.'}
          </motion.p>
        </div>

        <div className="flex gap-4">
          {isTeacher && (
            <button 
              onClick={() => setShowWeightForm(!showWeightForm)}
              className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-xs shadow-xl transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest ${
                showWeightForm ? 'bg-white border border-slate-200 text-slate-600' : 'bg-slate-900 text-white shadow-slate-900/10'
              }`}
            >
              <Scale size={18} /> {showWeightForm ? 'Cancel' : 'Set Weights'}
            </button>
          )}
        </div>
      </header>

      {/* Weight Config Form */}
      <AnimatePresence>
        {showWeightForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 48 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[32px] border-2 border-indigo-100 p-8 lg:p-10 shadow-xl shadow-indigo-900/5">
              <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Configure Academic Weights</h3>
              <form onSubmit={handleSaveWeights}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label htmlFor="assignment-weight" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Assignments Weight (%)</label>
                    <input id="assignment-weight" type="number" min="0" max="100" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none" value={wForm.assignmentWeight} onChange={e => { const v = parseInt(e.target.value) || 0; setWForm({ assignmentWeight: v, quizWeight: 100 - v }); }} />
                  </div>
                  <div>
                    <label htmlFor="quiz-weight" className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Quizzes Weight (%)</label>
                    <input id="quiz-weight" type="number" min="0" max="100" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none" value={wForm.quizWeight} onChange={e => { const v = parseInt(e.target.value) || 0; setWForm({ quizWeight: v, assignmentWeight: 100 - v }); }} />
                  </div>
                </div>
                
                <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 font-bold ${wForm.assignmentWeight + wForm.quizWeight === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                  {wForm.assignmentWeight + wForm.quizWeight === 100 ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  Total Allocation: {wForm.assignmentWeight + wForm.quizWeight}% {wForm.assignmentWeight + wForm.quizWeight !== 100 && '(Must equal 100%)'}
                </div>

                <div className="flex gap-4">
                  <button type="submit" disabled={savingW || wForm.assignmentWeight + wForm.quizWeight !== 100} className="flex-1 h-14 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                    {savingW ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Weights
                  </button>
                  <button type="button" onClick={() => setShowWeightForm(false)} className="px-10 h-14 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-[32px] bg-slate-100 animate-pulse" />)}
        </div>
      ) : isStudent ? (
        <>
          {/* Student Final Grade Card */}
          {finalGrade && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm mb-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-5 text-blue-600 pointer-events-none">
                 <Trophy size={160} />
               </div>
               
               <div className="relative shrink-0">
                  <div className="w-32 h-32 rounded-full border-[10px] border-slate-100 flex items-center justify-center relative">
                    <svg className="absolute inset-[-10px] rotate-[-90deg] w-[140px] h-[140px]">
                       <circle 
                         cx="70" cy="70" r="60" fill="transparent" stroke="currentColor" strokeWidth="10" 
                         className="text-blue-600" 
                         strokeDasharray={377}
                         strokeDashoffset={377 - (377 * (finalGrade.finalPercentage || 0)) / 100}
                         strokeLinecap="round"
                       />
                    </svg>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{Math.round(finalGrade.finalPercentage || 0)}%</span>
                  </div>
               </div>

               <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight uppercase">Current Final Standing</h2>
                  <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assignments Avg</span>
                      <span className="font-bold text-slate-900">{Math.round(finalGrade.assignmentAverage || 0)}% <span className="text-slate-400 font-medium">({weights?.assignmentWeight || 60}%)</span></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quizzes Avg</span>
                      <span className="font-bold text-slate-900">{Math.round(finalGrade.quizAverage || 0)}% <span className="text-slate-400 font-medium">({weights?.quizWeight || 40}%)</span></span>
                    </div>
                  </div>
               </div>

               <div className={`px-10 py-6 rounded-[24px] border-2 text-center min-w-[180px] ${getGradeColor(finalGrade.finalPercentage || 0)}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Outcome</p>
                  <p className="text-2xl font-black uppercase tracking-tighter">
                    {finalGrade.finalPercentage >= 70 ? 'Pass' : finalGrade.finalPercentage >= 50 ? 'Marginal' : 'Fail'}
                  </p>
               </div>
            </motion.div>
          )}

          {/* Student Grade Items Table */}
          <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Academic Itemization</h3>
              <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                <FileText size={14} /> {myGrades.length} Graded Items
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Source Item</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Proficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {myGrades.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-slate-400 font-bold">No academic items have been graded yet.</p>
                      </td>
                    </tr>
                  ) : myGrades.map((g) => {
                    const p = Math.round((g.score / g.maxScore) * 100);
                    return (
                      <tr key={g._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                              <HelpCircle size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight mb-1">{g.sourceId?.title || 'Unknown Item'}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(g.gradedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                            g.sourceType === 'quiz' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            {g.sourceType}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-700">{g.score} <span className="text-slate-400 font-medium">/ {g.maxScore}</span></span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <span className={`inline-block px-4 py-1.5 rounded-xl font-black text-sm tracking-tight border ${getGradeColor(p)}`}>
                            {p}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Teacher At-Risk Alert */}
          {atRisk.length > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-rose-50 border-2 border-rose-100 rounded-[40px] p-10 mb-12 flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 bg-rose-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-rose-900/20 shrink-0">
                <ShieldAlert size={40} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-rose-900 mb-2 tracking-tight">Academic At-Risk Alert</h3>
                <p className="text-rose-700 font-medium mb-6">We identified <span className="font-black underline">{atRisk.length} students</span> currently performing below the 50% proficiency threshold.</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {atRisk.map(s => (
                    <div key={s.student?._id} className="bg-white/60 px-4 py-2 rounded-xl border border-rose-200 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-[10px]">{s.student?.name?.charAt(0)}</div>
                      <span className="text-xs font-black text-rose-900 uppercase tracking-widest">{s.student?.name}</span>
                      <span className="text-xs font-black text-rose-600">{Math.round(s.finalPercentage || 0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="px-8 h-14 rounded-2xl bg-rose-600 text-white font-black hover:bg-rose-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-rose-900/10">
                Take Action
              </button>
            </motion.div>
          )}

          {/* Teacher Gradebook */}
          <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-900 tracking-tight">Course Gradebook</h3>
               <div className="relative group">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    aria-label="Filter students by name"
                    placeholder="Filter by student name..." 
                    className="h-10 pl-10 pr-4 rounded-xl bg-white border border-slate-200 text-xs font-bold outline-none focus:border-blue-500 transition-colors" 
                  />
               </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enrolled Student</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment Avg</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quiz Avg</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gradebook.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <p className="text-slate-400 font-bold">No students currently have recorded grades.</p>
                      </td>
                    </tr>
                  ) : gradebook.map((entry) => {
                    const fp = Math.round(entry.finalPercentage || 0);
                    return (
                      <tr key={entry.student?._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black text-xs border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                              {entry.student?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-tight mb-0.5">{entry.student?.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.student?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-700">{Math.round(entry.assignmentAverage || 0)}%</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-black text-slate-700">{Math.round(entry.quizAverage || 0)}%</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="inline-flex items-center gap-3">
                              <span className={`px-4 py-1.5 rounded-xl font-black text-sm tracking-tight border ${getGradeColor(fp)}`}>
                                {fp}%
                              </span>
                              <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center border border-slate-100">
                                <ArrowUpRight size={14} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
