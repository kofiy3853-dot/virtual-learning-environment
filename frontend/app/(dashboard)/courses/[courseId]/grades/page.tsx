'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, Star, Target, TrendingUp, 
  BarChart3, FileText, CheckCircle2, AlertCircle,
  Search, Filter, ChevronRight, ArrowUpRight,
  Loader2, Sparkles, Award, BookOpen, HelpCircle,
  Scale, Save, X, User, ShieldAlert, Zap,
  Activity, PieChart, ShieldCheck, Cpu
} from 'lucide-react';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { Course } from '@/types';

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
  
  const [course, setCourse] = useState<Course | null>(null);
  const [weights, setWeights] = useState<{ assignmentWeight: number; quizWeight: number } | null>(null);
  const [finalGrade, setFinalGrade] = useState<{ finalPercentage: number; assignmentAverage: number; quizAverage: number } | null>(null);
  const [myGrades, setMyGrades] = useState<GradeItem[]>([]);
  const [gradebook, setGradebook] = useState<GradebookEntry[]>([]);
  const [atRisk, setAtRisk] = useState<GradebookEntry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [wForm, setWForm] = useState({ assignmentWeight: 60, quizWeight: 40 });
  const [savingW, setSavingW] = useState(false);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    const loadData = async () => {
      if (!courseId) return;
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
            courseApi.getStudentGrades(courseId),
            courseApi.getStudentFinalGrade(courseId)
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
    };

    loadData();
  }, [courseId, isStudent, isTeacher]);

  const handleSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wForm.assignmentWeight + wForm.quizWeight !== 100) {
      toast.error('Weights must add up to exactly 100%.');
      return;
    }
    setSavingW(true);
    try {
      const res = await courseApi.setGradeWeights(courseId, wForm);
      setWeights(res.data.data);
      setShowWeightForm(false);
      toast.success('Academic weights updated successfully!');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update weights.');
    } finally {
      setSavingW(false);
    }
  };

  const getGradeColor = (p: number) => {
    if (p >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (p >= 50) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const getGradeText = (p: number) => {
    if (p >= 70) return 'Distinction';
    if (p >= 50) return 'Proficient';
    return 'At-Risk';
  };

  return (
    <div className="space-y-12 pb-20">
      
      {/* Immersive Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-primary-500 font-black text-[10px] uppercase tracking-[0.3em]">
            <Trophy size={14} />
            Performance Intelligence
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
            Academic <span className="text-primary-500">Analytics</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
            {isTeacher 
              ? 'Synthesize class-wide performance metrics, manage algorithmic weights, and derive actionable insights from student outcomes.' 
              : 'Monitor your cognitive progression, track synchronized grading nodes, and visualize your terminal academic standing.'}
          </p>
        </div>

        <div className="flex gap-4">
          {isTeacher && (
            <button 
              onClick={() => setShowWeightForm(p => !p)}
              className={`btn h-16 px-10 gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all ${
                showWeightForm 
                  ? 'bg-slate-900 text-white shadow-slate-900/20' 
                  : 'btn-primary shadow-primary-500/20'
              }`}
            >
              {showWeightForm ? <><X size={20} /> Close Console</> : <><Scale size={20} /> Configure Weights</>}
            </button>
          )}
        </div>
      </header>

      {/* Administrative Console (Form) */}
      <AnimatePresence>
        {showWeightForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 48 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[48px] border border-slate-100 p-12 shadow-2xl shadow-primary-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center border border-primary-100 shadow-inner">
                  <PieChart size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">Calculation Engine</h3>
                  <p className="text-slate-500 font-medium">Define the algorithmic contribution of academic categories.</p>
                </div>
              </div>

              <form onSubmit={handleSaveWeights} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label htmlFor="w-assignment" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Assignment Contribution (%)</label>
                    <input 
                      id="w-assignment"
                      type="number" min="0" max="100"
                      className="input-premium h-16 text-lg" 
                      value={wForm.assignmentWeight} 
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        setWForm({ assignmentWeight: v, quizWeight: 100 - v });
                      }}
                    />
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="w-quiz" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Quiz Contribution (%)</label>
                    <input 
                      id="w-quiz"
                      type="number" min="0" max="100"
                      className="input-premium h-16 text-lg" 
                      value={wForm.quizWeight} 
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        setWForm({ quizWeight: v, assignmentWeight: 100 - v });
                      }}
                    />
                  </div>
                </div>

                <div className={`p-6 rounded-[32px] border flex items-center gap-4 transition-all duration-500 ${
                  wForm.assignmentWeight + wForm.quizWeight === 100 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                    : 'bg-rose-50 border-rose-100 text-rose-700'
                }`}>
                  {wForm.assignmentWeight + wForm.quizWeight === 100 ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  <div className="flex-1">
                    <p className="text-sm font-bold uppercase tracking-widest leading-none mb-1">Vector Alignment</p>
                    <p className="text-[10px] font-medium opacity-70">Total contribution must equal 100% for mathematical integrity. Currently: {wForm.assignmentWeight + wForm.quizWeight}%</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="submit" 
                    disabled={savingW || wForm.assignmentWeight + wForm.quizWeight !== 100} 
                    className="btn btn-primary flex-1 h-16 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20"
                  >
                    {savingW ? <Loader2 size={20} className="animate-spin" /> : <><Zap size={18} fill="currentColor" className="mr-2" /> Synchronize Engine</>}
                  </button>
                  <button type="button" onClick={() => setShowWeightForm(false)} className="btn btn-secondary px-12 h-16 text-[10px] font-black uppercase tracking-widest">
                    Abort
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white border border-slate-100 rounded-[48px] animate-pulse shadow-sm" />)}
        </div>
      ) : isStudent ? (
        <div className="space-y-12">
          {/* Student Performance Matrix */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[64px] border border-slate-100 p-12 lg:p-16 shadow-2xl shadow-primary-500/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-16 text-primary-500/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Target size={240} />
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="shrink-0 relative">
                <div className="w-48 h-48 rounded-full border-[16px] border-slate-50 flex items-center justify-center relative shadow-inner">
                  <svg className="absolute inset-[-16px] rotate-[-90deg] w-[224px] h-[224px]">
                     <circle 
                       cx="112" cy="112" r="96" fill="transparent" stroke="currentColor" strokeWidth="16" 
                       className="text-primary-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                       strokeDasharray={603}
                       strokeDashoffset={603 - (603 * (finalGrade?.finalPercentage || 0)) / 100}
                       strokeLinecap="round"
                     />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-none">{Math.round(finalGrade?.finalPercentage || 0)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">% Vector</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-8 text-center lg:text-left">
                <div className="space-y-2">
                  <h2 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">Current Intelligence <span className="text-primary-500">Standing</span></h2>
                  <p className="text-slate-500 font-medium text-lg">Predictive calculation based on active curriculum nodes.</p>
                </div>
                
                <div className="flex flex-wrap justify-center lg:justify-start gap-10">
                  <div className="space-y-2">
                    <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <FileText size={14} className="text-primary-500" /> Assignment Vectors
                    </span>
                    <p className="text-2xl font-display font-extrabold text-slate-800">
                      {Math.round(finalGrade?.assignmentAverage || 0)}% 
                      <span className="text-sm font-bold text-slate-300 ml-2">({weights?.assignmentWeight || 60}% weight)</span>
                    </p>
                  </div>
                  <div className="w-px h-12 bg-slate-100 hidden lg:block" />
                  <div className="space-y-2">
                    <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Activity size={14} className="text-primary-500" /> Quiz Transmission
                    </span>
                    <p className="text-2xl font-display font-extrabold text-slate-800">
                      {Math.round(finalGrade?.quizAverage || 0)}%
                      <span className="text-sm font-bold text-slate-300 ml-2">({weights?.quizWeight || 40}% weight)</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className={`px-12 py-8 rounded-[40px] border-2 text-center min-w-[220px] transition-all duration-700 ${getGradeColor(finalGrade?.finalPercentage || 0)}`}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">Calculated Outcome</p>
                <p className="text-3xl font-display font-extrabold uppercase tracking-tight leading-none mb-1">
                  {getGradeText(finalGrade?.finalPercentage || 0)}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Synchronized</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Student Grade Log */}
          <div className="bg-white rounded-[56px] border border-slate-100 overflow-hidden shadow-2xl shadow-primary-500/5">
            <div className="p-10 lg:p-12 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">Academic Itemization</h3>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Detailed transmission ledger</p>
              </div>
              <div className="flex items-center gap-4 text-primary-500 text-[10px] font-black uppercase tracking-[0.2em] bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <Cpu size={16} /> {myGrades.length} Processing Nodes
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">Intelligence Node</th>
                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">Vector Type</th>
                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">Score Delta</th>
                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">Proficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {myGrades.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-12 py-32 text-center group">
                        <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-slate-100 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                          <BookOpen size={32} className="text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold text-lg">No academic items have been processed by the engine.</p>
                      </td>
                    </tr>
                  ) : myGrades.map((g, idx) => {
                    const p = Math.round((g.score / g.maxScore) * 100);
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        key={g._id} className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-12 py-8">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary-500 group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary-500/20 transition-all duration-700 border border-slate-100">
                              <HelpCircle size={20} />
                            </div>
                            <div>
                              <p className="font-display font-extrabold text-slate-900 text-lg tracking-tight mb-1 group-hover:text-primary-600 transition-colors">{g.sourceId?.title || 'Unknown Item'}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(g.gradedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-8">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                            g.sourceType === 'quiz' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {g.sourceType}
                          </span>
                        </td>
                        <td className="px-12 py-8">
                          <div className="flex flex-col">
                            <span className="text-lg font-display font-extrabold text-slate-800">{g.score}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">/ {g.maxScore} Base</span>
                          </div>
                        </td>
                        <td className="px-12 py-8 text-right">
                          <span className={`inline-block px-6 py-2 rounded-2xl font-display font-extrabold text-lg tracking-tight border shadow-sm ${getGradeColor(p)}`}>
                            {p}%
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Teacher At-Risk Intelligence */}
          <AnimatePresence>
            {atRisk.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-rose-50 border border-rose-100 rounded-[56px] p-12 lg:p-16 shadow-2xl shadow-rose-900/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-16 text-rose-500/5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                  <ShieldAlert size={280} />
                </div>

                <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                  <div className="w-28 h-28 bg-rose-600 rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-rose-900/30 shrink-0 border-4 border-white/20">
                    <ShieldAlert size={56} />
                  </div>
                  <div className="flex-1 text-center lg:text-left space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-4xl font-display font-extrabold text-rose-900 tracking-tight">Critical Performance <span className="text-rose-600">Insight</span></h3>
                      <p className="text-rose-700/80 font-medium text-lg">Vector calculation identified <span className="font-black text-rose-900 underline underline-offset-8">{atRisk.length} students</span> performing below protocol thresholds.</p>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                      {atRisk.map(s => (
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -5 }}
                          key={s.student?._id} 
                          className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-[24px] border border-rose-200 flex items-center gap-4 shadow-sm"
                        >
                          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-rose-900/20">{s.student?.name?.charAt(0)}</div>
                          <div className="text-left">
                            <p className="text-xs font-black text-rose-900 uppercase tracking-widest">{s.student?.name}</p>
                            <p className="text-[10px] font-black text-rose-500">{Math.round(s.finalPercentage || 0)}% Efficiency</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <button className="btn bg-rose-600 text-white hover:bg-rose-700 px-12 h-16 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-rose-900/20 shrink-0">
                    Initiate Intervention
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global Performance Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center border border-primary-100">
                  <TrendingUp size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Class Efficiency</p>
                  <p className="text-4xl font-display font-extrabold text-slate-900">
                    {gradebook.length > 0 ? Math.round(gradebook.reduce((a,b)=>a+b.finalPercentage,0)/gradebook.length) : 0}%
                  </p>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${gradebook.length > 0 ? Math.round(gradebook.reduce((a,b)=>a+b.finalPercentage,0)/gradebook.length) : 0}%` }} />
                </div>
             </div>
             <div className="bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nodes Graded</p>
                  <p className="text-4xl font-display font-extrabold text-slate-900">
                    {myGrades.length} Assets
                  </p>
                </div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg inline-block">Protocols Synchronized</p>
             </div>
             <div className="bg-white rounded-[48px] border border-slate-100 p-10 shadow-sm space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                  <Users size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Processing Stream</p>
                  <p className="text-4xl font-display font-extrabold text-slate-900">
                    {gradebook.length} Entities
                  </p>
                </div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-lg inline-block">Active Computation</p>
             </div>
          </div>

          {/* Global Gradebook Ledger */}
          <div className="bg-white rounded-[56px] border border-slate-100 overflow-hidden shadow-2xl shadow-primary-500/5">
            <div className="p-10 lg:p-12 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50/20">
              <div className="space-y-1">
                <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">Intelligence Gradebook</h3>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Aggregated performance telemetry</p>
              </div>
              <div className="relative group flex-1 max-w-md">
                 <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
                 <input 
                   placeholder="Filter entities by designation..." 
                   className="w-full h-16 pl-16 pr-8 rounded-[28px] bg-white border border-slate-100 text-sm font-bold outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all shadow-sm" 
                 />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white">
                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">Enrolled Entity</th>
                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">Assignment Avg</th>
                    <th className="px-12 py-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">Quiz Transmissions</th>
                    <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50">Vector Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gradebook.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-12 py-32 text-center">
                        <p className="text-slate-400 font-bold text-lg">Intelligence void: No entities have recorded telemetry.</p>
                      </td>
                    </tr>
                  ) : gradebook.map((entry, idx) => {
                    const fp = Math.round(entry.finalPercentage || 0);
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        key={entry.student?._id} className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-12 py-8">
                          <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-display font-extrabold text-lg border border-primary-100 group-hover:bg-primary-500 group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary-500/20 transition-all duration-700">
                              {entry.student?.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-display font-extrabold text-slate-900 text-lg leading-tight mb-1 group-hover:text-primary-600 transition-colors">{entry.student?.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.student?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-12 py-8">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-display font-extrabold text-slate-700">{Math.round(entry.assignmentAverage || 0)}%</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                          </div>
                        </td>
                        <td className="px-12 py-8">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-display font-extrabold text-slate-700">{Math.round(entry.quizAverage || 0)}%</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                          </div>
                        </td>
                        <td className="px-12 py-8 text-right">
                           <div className="inline-flex items-center gap-6">
                              <span className={`px-6 py-2 rounded-2xl font-display font-extrabold text-lg tracking-tight border shadow-sm ${getGradeColor(fp)}`}>
                                {fp}%
                              </span>
                              <button aria-label="Access entity profile" className="w-12 h-12 rounded-2xl bg-white text-slate-300 hover:bg-slate-900 hover:text-white hover:shadow-xl hover:shadow-slate-900/20 transition-all flex items-center justify-center border border-slate-100 active:scale-90">
                                <ArrowUpRight size={20} />
                              </button>
                           </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Users({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
