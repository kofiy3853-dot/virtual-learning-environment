'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Loader2, CheckCircle2, AlertCircle, Sparkles, Star, 
  FileText, Clock, BarChart3, ArrowLeft, Send, X,
  GraduationCap, Target, Zap, TrendingUp, Users, Cpu, Shield
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import SubmissionStudio from '@/components/learning/SubmissionStudio';
import DashboardLayout from '@/layouts/DashboardLayout';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
}

interface Submission {
  _id: string;
  student: { _id: string, name: string };
  submittedAt: string;
  textContent?: string;
  files?: string[];
  status: 'submitted' | 'graded' | 'late';
  grade?: number;
  feedback?: string;
}

export default function AssignmentDetailPage() {
  const { courseId, assignmentId } = useParams() as { courseId: string, assignmentId: string };
  const { user } = useAuth();
  
  const [assignment, setAssignment]= useState<Assignment | null>(null);
  const [submission, setSubmission]= useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]      = useState(true);
  const [submitting, setSubmitting]= useState(false);
  const [grading, setGrading]      = useState<string | null>(null);
  const [gradeForm, setGradeForm]  = useState<Record<string, { grade: string, feedback: string }>>({});

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const loadData = useCallback(async () => {
    if (!assignmentId) return;
    try {
      const aRes = await courseApi.getAssignment(assignmentId);
      setAssignment(aRes.data.data);
      
      if (isStudent) {
        try {
          const sRes = await courseApi.getMySubmission(assignmentId);
          setSubmission(sRes.data.data);
        } catch (err) {}
      }
      
      if (isTeacher) {
        try {
          const sRes = await courseApi.getSubmissions(assignmentId);
          setAllSubmissions(sRes.data.data || []);
        } catch (err) {}
      }
    } catch (err) {
      toast.error('Synchronization error detected.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, isStudent, isTeacher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFinalSubmit = async (textContent: string, files: File[]) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('textContent', textContent);
      files.forEach(f => fd.append('files', f));
      const res = await courseApi.submitAssignment(assignmentId, fd);
      setSubmission(res.data.data);
      toast.success('Transmission successful. Mission complete.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transmission disrupted.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    const gf = gradeForm[submissionId];
    if (!gf?.grade) { toast.error('Grade input missing.'); return; }
    setGrading(submissionId);
    try {
      await courseApi.gradeSubmission(submissionId, { 
        grade: parseInt(gf.grade), 
        feedback: gf.feedback || '' 
      });
      setAllSubmissions(p => p.map(s => s._id === submissionId ? { ...s, grade: parseInt(gf.grade), feedback: gf.feedback, status:'graded' } : s));
      toast.success('Assessment protocols finalized.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Grading sequence failed.');
    } finally {
      setGrading(null);
    }
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin shadow-xl shadow-primary-500/5" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu size={28} className="text-primary-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-500">Establishing Uplink</p>
          <p className="text-slate-400 font-medium text-sm">Synchronizing mission telemetry...</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-20">
        
        {/* Breadcrumb Navigation */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <Link href={`/courses/${courseId}/assignments`} className="group flex items-center gap-4 text-slate-400 hover:text-primary-500 transition-all">
              <div className="w-12 h-12 flex items-center justify-center rounded-[18px] border border-slate-100 group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:-translate-x-1 transition-all shadow-sm">
                <ArrowLeft size={20} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] block">Navigation</span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-primary-500">Back to Mission Backlog</span>
              </div>
           </Link>
        </header>

        {isStudent && assignment && (
          <div className="space-y-12">
            <SubmissionStudio 
              assignment={assignment} 
              submission={submission} 
              onSubmit={handleFinalSubmit}
            />
          </div>
        )}

        {isTeacher && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              
              {/* Mission Protocol Overview */}
              <section className="bg-white rounded-[48px] border border-slate-100 p-10 lg:p-14 relative overflow-hidden group shadow-2xl shadow-slate-200/20">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3 text-primary-500 text-[10px] font-black uppercase tracking-[0.3em]">
                    <Shield size={16} /> instructor Command Terminal
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
                      {assignment?.title}
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
                      {assignment?.description || "No technical specifications provided for this mission."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <div className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3 shadow-sm group-hover:border-primary-100 transition-colors">
                      <Target size={16} className="text-primary-500" /> {assignment?.totalMarks} Weight
                    </div>
                    <div className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3 shadow-sm group-hover:border-primary-100 transition-colors">
                      <Users size={16} className="text-primary-500" /> {allSubmissions.length} Transmissions
                    </div>
                    <div className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3 shadow-sm group-hover:border-primary-100 transition-colors">
                      <Clock size={16} className="text-primary-500" /> {assignment ? format(new Date(assignment.dueDate), 'MMM dd, yyyy') : 'N/A'}
                    </div>
                  </div>
                </div>
              </section>

              {/* Grading Intelligence Queue */}
              <section className="space-y-10">
                <div className="flex items-center justify-between px-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Grading Queue</h2>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-[10px]">Evaluating cohort outcomes</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Pool</span>
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-center font-black">{allSubmissions.length}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {allSubmissions.length === 0 ? (
                    <div className="py-32 text-center bg-white rounded-[48px] border border-dashed border-slate-200 group hover:border-primary-500/50 transition-all duration-700">
                      <div className="w-24 h-24 bg-slate-50 rounded-[32px] shadow-inner mx-auto flex items-center justify-center mb-8 border border-slate-100 group-hover:scale-110 transition-transform duration-700">
                        <GraduationCap size={40} className="text-slate-200 group-hover:text-primary-500 transition-colors" />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Waiting for student transmissions</p>
                    </div>
                  ) : allSubmissions.map((sub, idx) => (
                    <motion.div 
                      key={sub._id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="bg-white rounded-[40px] border border-slate-100 p-10 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-900/10 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                      
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-8 mb-10 relative z-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-slate-900/20 group-hover:scale-110 transition-transform">
                            {sub.student?.name?.charAt(0)}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xl font-bold text-slate-900 tracking-tight">{sub.student?.name}</h4>
                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               <Clock size={12} className="text-primary-500" /> Received {format(new Date(sub.submittedAt), 'MMM dd, p')}
                            </div>
                          </div>
                        </div>
                        <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                          sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-primary-50 text-primary-600 border-primary-100'
                        }`}>
                          {sub.status === 'graded' ? <><CheckCircle2 size={12} className="inline mr-2" /> Protocol Finalized</> : 'Pending Analysis'}
                        </div>
                      </div>

                      {sub.textContent && (
                        <div className="bg-slate-50/80 rounded-[28px] p-8 border border-slate-100 mb-10 text-base font-medium text-slate-600 leading-relaxed whitespace-pre-wrap relative z-10">
                          {sub.textContent}
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
                        <div className="lg:col-span-3">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Performance Score</label>
                             <input 
                               type="number" min="0" max={assignment?.totalMarks} 
                               placeholder={`0 - ${assignment?.totalMarks}`}
                               className="input-premium h-16 font-black text-center text-lg"
                               defaultValue={sub.grade}
                               onChange={e => setGradeForm(p => ({ ...p, [sub._id]: { ...p[sub._id], grade: e.target.value } }))}
                             />
                          </div>
                        </div>
                        <div className="lg:col-span-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Critical Insight</label>
                             <input 
                               placeholder="Outline assessment highlights..."
                               className="input-premium h-16 font-medium px-8"
                               defaultValue={sub.feedback}
                               onChange={e => setGradeForm(p => ({ ...p, [sub._id]: { ...p[sub._id], feedback: e.target.value } }))}
                             />
                          </div>
                        </div>
                        <div className="lg:col-span-3 flex items-end">
                          <button 
                            onClick={() => handleGrade(sub._id)}
                            disabled={grading === sub._id}
                            className="btn btn-primary w-full h-16 uppercase tracking-widest font-black text-[10px] shadow-xl shadow-primary-500/20 active:scale-95"
                          >
                            {grading === sub._id ? <Loader2 size={18} className="animate-spin mr-2" /> : <Send size={18} className="mr-2" />}
                            {sub.status === 'graded' ? 'Update Eval' : 'Publish Result'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              
              {/* Analytics Hub */}
              <section className="bg-white rounded-[48px] border border-slate-100 p-10 shadow-2xl shadow-slate-200/10 space-y-10 group">
                <div className="flex items-center gap-3 text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">
                  <BarChart3 size={16} /> Analytics Hub
                </div>
                <div className="space-y-4">
                  <StatRow icon={<Clock size={18} />} label="Operational Deadline" value={assignment ? format(new Date(assignment.dueDate), 'MMM dd, yyyy') : 'N/A'} />
                  <StatRow icon={<TrendingUp size={18} />} label="Cohort Velocity" value={`${Math.round((allSubmissions.length / 30) * 100)}%`} />
                  <StatRow icon={<Zap size={18} />} label="Submission Yield" value={`${allSubmissions.length} active`} />
                  <StatRow icon={<Star size={18} />} label="Average Yield" value="-- pts" />
                </div>
              </section>

              {/* AI Insight Box */}
              <section className="bg-slate-900 rounded-[48px] p-10 text-white space-y-8 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl" />
                 <div className="w-16 h-16 rounded-[24px] bg-primary-500/20 flex items-center justify-center border border-primary-500/20 group-hover:scale-110 transition-transform duration-700">
                    <Sparkles className="text-primary-400" size={28} />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-2xl font-display font-extrabold tracking-tight">AI Intelligence</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      Intelligence synthesis indicates a high engagement trend. 85% of active cohort members finalized their transmissions 24h before the operational deadline.
                    </p>
                 </div>
                 <button className="w-full py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all active:scale-95">
                    Generate Executive Report
                 </button>
              </section>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-slate-50 last:border-0 group-hover:border-primary-50 transition-colors">
      <div className="flex items-center gap-4 text-slate-400">
        <div className="text-primary-500 bg-primary-50 p-2 rounded-xl">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-base font-extrabold text-slate-900">{value}</span>
    </div>
  );
}
