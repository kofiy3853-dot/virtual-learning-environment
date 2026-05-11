'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Star, FileText, Clock, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import SubmissionStudio from '@/components/learning/SubmissionStudio';


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
  const params = useParams();
  const courseId = params.courseId as string;
  const assignmentId = params.assignmentId as string;
  const { user } = useAuth();
  
  const [assignment, setAssignment]= useState<Assignment | null>(null);
  const [submission, setSubmission]= useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]      = useState(true);
  const [submitting, setSubmitting]= useState(false);
  const [grading, setGrading]      = useState<string | null>(null);
  const [gradeForm, setGradeForm]  = useState<Record<string, { grade: string, feedback: string }>>({});
  const [toast, setToast]          = useState<{ msg: string, type: string } | null>(null);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
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
      showToast('Failed to synchronize assignment intelligence', 'error');
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
      showToast('Assignment transmitted successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Transmission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    const gf = gradeForm[submissionId];
    if (!gf?.grade) { showToast('Enter evaluation grade.', 'error'); return; }
    setGrading(submissionId);
    try {
      await courseApi.gradeSubmission(submissionId, { 
        grade: parseInt(gf.grade), 
        feedback: gf.feedback || '' 
      });
      setAllSubmissions(p => p.map(s => s._id === submissionId ? { ...s, grade: parseInt(gf.grade), feedback: gf.feedback, status:'graded' } : s));
      showToast('Evaluation finalized successfully!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Grading protocol failed.', 'error');
    } finally {
      setGrading(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
             
             <AnimatePresence>
                {toast && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
                    className={`fixed top-12 left-1/2 z-[100] px-8 py-4 rounded-2xl font-black shadow-2xl border flex items-center gap-3 ${
                      toast.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    {toast.msg}
                  </motion.div>
                )}
             </AnimatePresence>

             {isStudent && assignment && (
                <SubmissionStudio 
                  assignment={assignment} 
                  submission={submission} 
                  onSubmit={handleFinalSubmit}
                />
             )}

             {isTeacher && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   <div className="lg:col-span-8 space-y-12">
                      <header className="bg-white rounded-[48px] border border-slate-100 p-12 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
                         <div className="relative z-10">
                            <div className="flex items-center gap-3 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                               <Sparkles size={14} /> Instructor Workspace
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6">{assignment?.title}</h1>
                            <div className="flex flex-wrap gap-4">
                               <div className="px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                                  <Star size={14} className="text-indigo-600" /> {assignment?.totalMarks} Points Max
                               </div>
                               <div className="px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                                  <FileText size={14} className="text-indigo-600" /> {allSubmissions.length} Submissions
                               </div>
                            </div>
                         </div>
                      </header>

                      <section className="space-y-6">
                         <h2 className="text-3xl font-black text-slate-900 tracking-tight px-4">Submissions Queue.</h2>
                         <div className="space-y-4">
                            {allSubmissions.length === 0 ? (
                               <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-20 text-center text-slate-400 font-bold">
                                  No academic resources have been transmitted yet.
                               </div>
                            ) : allSubmissions.map(sub => (
                               <div key={sub._id} className="bg-white rounded-[40px] border border-slate-100 p-10 hover:border-indigo-200 transition-all group shadow-sm hover:shadow-xl hover:shadow-indigo-900/5">
                                  <div className="flex items-center justify-between mb-8">
                                     <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg group-hover:scale-110 transition-transform">
                                           {sub.student?.name?.charAt(0)}
                                        </div>
                                        <div>
                                           <h4 className="text-lg font-black text-slate-900">{sub.student?.name}</h4>
                                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Received {format(new Date(sub.submittedAt), 'PPP p')}</p>
                                        </div>
                                     </div>
                                     <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                       sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                     }`}>
                                        {sub.status}
                                     </div>
                                  </div>

                                  {sub.textContent && (
                                     <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 mb-8 text-slate-700 leading-relaxed font-medium">
                                        {sub.textContent}
                                     </div>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                     <div className="md:col-span-3">
                                        <input 
                                          type="number" min="0" max={assignment?.totalMarks} 
                                          placeholder="Grade"
                                          className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-6 font-black focus:border-indigo-600 outline-none transition-all"
                                          defaultValue={sub.grade}
                                          onChange={e => setGradeForm(p => ({ ...p, [sub._id]: { ...p[sub._id], grade: e.target.value } }))}
                                        />
                                     </div>
                                     <div className="md:col-span-6">
                                        <input 
                                          placeholder="Strategy Feedback"
                                          className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-6 font-bold focus:border-indigo-600 outline-none transition-all"
                                          defaultValue={sub.feedback}
                                          onChange={e => setGradeForm(p => ({ ...p, [sub._id]: { ...p[sub._id], feedback: e.target.value } }))}
                                        />
                                     </div>
                                     <div className="md:col-span-3">
                                        <button 
                                          onClick={() => handleGrade(sub._id)}
                                          disabled={grading === sub._id}
                                          className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                        >
                                           {grading === sub._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                           {sub.status === 'graded' ? 'Update' : 'Grade'}
                                        </button>
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </section>
                   </div>

                   <aside className="lg:col-span-4 space-y-8">
                      <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Intelligence Summary</h3>
                         <div className="space-y-6">
                            <TechnicalRow icon={<Clock size={16} />} label="Due Date" value={assignment ? format(new Date(assignment.dueDate), 'MMM dd, yyyy') : ''} />
                            <TechnicalRow icon={<BarChart3 size={16} />} label="Participation" value={`${Math.round((allSubmissions.length / 30) * 100)}%`} />
                            <TechnicalRow icon={<Star size={16} />} label="Average Yield" value="-- pts" />
                         </div>
                      </div>
                   </aside>
                </div>
             )}

          </div>
    </div>
  );
}

function TechnicalRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
       <div className="flex items-center gap-3 text-slate-400">
          {icon}
          <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}
