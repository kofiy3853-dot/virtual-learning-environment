'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Loader2, CheckCircle2, AlertCircle, FileText, Clock, 
  ArrowLeft, X, GraduationCap, Target, Users, ExternalLink,
  ChevronRight, Calendar, Award, Clipboard, ChevronDown, Check, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import SubmissionStudio from '@/components/learning/SubmissionStudio';
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
  fileUrls?: string[];
  status: 'submitted' | 'graded' | 'late';
  grade?: number;
  feedback?: string;
}

export default function AssignmentDetailPage() {
  const { courseId, assignmentId } = useParams() as { courseId: string, assignmentId: string };
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Teacher-specific state
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('overview');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradingInProgress, setGradingInProgress] = useState(false);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    
    const onScroll = () => setShowScrollTop(mainEl.scrollTop > 300);
    mainEl.addEventListener('scroll', onScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      if (!assignmentId) return;
      try {
        const aRes = await courseApi.getAssignment(assignmentId);
        if (!active) return;
        setAssignment(aRes.data.data);
        
        if (isStudent) {
          try {
            const sRes = await courseApi.getMySubmission(assignmentId);
            const subData = sRes.data.data;
            if (!active) return;
            if (subData) {
              setSubmission({
                ...subData,
                files: subData.fileUrls || subData.files || []
              });
            } else {
              setSubmission(null);
            }
          } catch (err) {}
        }
        
        if (isTeacher) {
          try {
            const sRes = await courseApi.getSubmissions(assignmentId);
            const mapped = (sRes.data.data || []).map((sub: Submission) => ({
              ...sub,
              files: sub.fileUrls || sub.files || []
            }));
            if (!active) return;
            setAllSubmissions(mapped);
          } catch (err) {}
        }
      } catch (err) {
        toast.error('Failed to load assignment details.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [assignmentId, isStudent, isTeacher]);

  const handleFinalSubmit = async (textContent: string, files: File[]) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('textContent', textContent);
      files.forEach(f => fd.append('files', f));
      const res = await courseApi.submitAssignment(assignmentId, fd);
      const subData = res.data.data;
      setSubmission({
        ...subData,
        files: subData.fileUrls || subData.files || []
      });
      toast.success('Assignment submitted successfully.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const openGradingModal = (sub: Submission) => {
    setSelectedSubmission(sub);
    setGradeInput(sub.grade !== undefined ? sub.grade.toString() : '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    if (!gradeInput || isNaN(Number(gradeInput))) {
      toast.error('Please enter a valid numeric grade.');
      return;
    }
    const numGrade = Number(gradeInput);
    if (assignment && (numGrade < 0 || numGrade > assignment.totalMarks)) {
      toast.error(`Grade must be between 0 and ${assignment.totalMarks}.`);
      return;
    }

    setGradingInProgress(true);
    try {
      await courseApi.gradeSubmission(selectedSubmission._id, { 
        grade: numGrade, 
        feedback: feedbackInput 
      });
      
      // Update local submissions list
      setAllSubmissions(prev => 
        prev.map(s => s._id === selectedSubmission._id 
          ? { ...s, grade: numGrade, feedback: feedbackInput, status: 'graded' } 
          : s
        )
      );
      toast.success('Grade and feedback updated successfully.');
      setSelectedSubmission(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to save grade.');
    } finally {
      setGradingInProgress(false);
    }
  };

  // Standard loading view
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      <p className="text-slate-400 font-medium text-sm">Loading workspace...</p>
    </div>
  );

  if (!assignment) return (
    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 p-8">
      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 mb-1">Assignment Not Found</h3>
      <p className="text-slate-500 mb-6 text-sm">This assignment may have been archived or deleted.</p>
      <Link href={`/courses/${courseId}/assignments`} className="btn btn-secondary text-xs">
        Return to Assignments
      </Link>
    </div>
  );

  const gradedCount = allSubmissions.filter(s => s.status === 'graded').length;
  const submissionsRate = allSubmissions.length > 0 ? Math.round((gradedCount / allSubmissions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6">
      <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <header className="flex items-center justify-between">
          <Link 
            href={`/courses/${courseId}/assignments`} 
            className="group inline-flex items-center gap-2 text-slate-500 hover:text-primary-500 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Assignments</span>
          </Link>
          
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-md border border-slate-200/50">
            Workspace
          </div>
        </header>

        {/* 1. Header Workspace Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 tracking-tight leading-tight">
                {assignment.title}
              </h1>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  Due {format(new Date(assignment.dueDate), 'PPP')}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1">
                  <Award size={14} className="text-slate-400" />
                  {assignment.totalMarks} Points Max
                </span>
              </div>
            </div>

            {isTeacher && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                    activeTab === 'overview' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveTab('submissions')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                    activeTab === 'submissions' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Submissions ({allSubmissions.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Structured Layout Splits */}
        {isStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Content Column (70%) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Instructions Panel */}
              <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Instructions & Specifications
                </h3>
                <div className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                  {assignment.description || 'No additional specifications provided for this task.'}
                </div>
              </section>

              {/* Submission Management Workspace */}
              <section className="space-y-4">
                <SubmissionStudio 
                  assignment={assignment} 
                  submission={submission} 
                  onSubmit={handleFinalSubmit}
                />
              </section>
            </div>

            {/* Right Sidebar Column (30%) */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
                  Submission Status
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Deadline</span>
                    <span className="text-sm font-bold text-slate-800">{format(new Date(assignment.dueDate), 'PPP p')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Grading Weight</span>
                    <span className="text-sm font-bold text-slate-800">{assignment.totalMarks} Points Possible</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Status</span>
                    <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      submission 
                        ? submission.status === 'graded' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {submission 
                        ? submission.status === 'graded' 
                          ? 'Graded & Evaluated' 
                          : 'Submitted for Review'
                        : 'Assigned / Incomplete'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {isTeacher && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Content Column (70%) */}
            <div className="lg:col-span-8 space-y-6">
              
              {activeTab === 'overview' ? (
                /* Overview Panel */
                <section className="bg-white rounded-2xl border border-slate-200/60 p-6 md:p-8 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Assignment Specifications
                  </h3>
                  <div className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                    {assignment.description || 'No additional specifications provided for this task.'}
                  </div>
                </section>
              ) : (
                /* Submissions Table List (Clean SaaS Design) */
                <section className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Submitted Workspace Items</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Select and evaluate submissions from this cohort</p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted At</th>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Grade</th>
                          <th className="px-6 py-3.5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {allSubmissions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-slate-400 text-sm font-medium">
                              No submissions received yet for this assignment.
                            </td>
                          </tr>
                        ) : (
                          allSubmissions.map((sub) => (
                            <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                    {sub.student?.name?.charAt(0)}
                                  </div>
                                  <span className="text-sm font-bold text-slate-900">{sub.student?.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                                {format(new Date(sub.submittedAt), 'MMM dd, yyyy · p')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                  sub.status === 'graded' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                  {sub.status === 'graded' ? 'Graded' : 'Needs Review'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                                {sub.grade !== undefined ? `${sub.grade} / ${assignment.totalMarks}` : '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                <button 
                                  onClick={() => openGradingModal(sub)}
                                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                                >
                                  {sub.status === 'graded' ? 'Review Grade' : 'Evaluate'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* Right Sidebar Column (30%) */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm space-y-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider">
                  Operational Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Submissions</span>
                    <span className="text-base font-extrabold text-slate-800">{allSubmissions.length} Students</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Evaluation Progress</span>
                    <span className="text-base font-extrabold text-slate-800">{gradedCount} of {allSubmissions.length} Graded</span>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${submissionsRate}%` }} />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Maximum Grade</span>
                    <span className="text-base font-extrabold text-slate-800">{assignment.totalMarks} Points Max</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

      </div>

      {/* 3. Focused Evaluation Modal (SaaS Grade Console) */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSubmission(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="relative bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 md:p-8 space-y-6 z-10"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      Evaluate Submission
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} /> {selectedSubmission.student?.name}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedSubmission(null)}
                    aria-label="Close Evaluation Console"
                    className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 scrollbar-premium">
                  {selectedSubmission.textContent && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted Response</span>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                        {selectedSubmission.textContent}
                      </div>
                    </div>
                  )}

                  {((selectedSubmission.files && selectedSubmission.files.length > 0) || (selectedSubmission.fileUrls && selectedSubmission.fileUrls.length > 0)) && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attached Files</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(selectedSubmission.files || selectedSubmission.fileUrls || []).map((url: string, i: number) => {
                          const rawName = url.substring(url.lastIndexOf('\\') + 1).substring(url.lastIndexOf('/') + 1);
                          const cleanName = rawName.includes('-') && rawName.split('-').length > 1 
                            ? rawName.substring(rawName.indexOf('-') + 1) 
                            : rawName || `Attachment ${i + 1}`;
                          return (
                            <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between group/file hover:border-primary-200 transition-all duration-300">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-lg bg-white text-primary-500 flex items-center justify-center shrink-0 border border-slate-100 shadow-xs">
                                  <FileText size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 truncate" title={cleanName}>{cleanName}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Verified</p>
                                </div>
                              </div>
                              <a 
                                href={url.startsWith('http') ? url : `http://localhost:5000/${url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                aria-label={`Download attachment ${cleanName}`}
                                className="w-8 h-8 rounded-lg bg-white text-slate-400 flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all shadow-xs shrink-0"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Grade Form */}
                <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4 space-y-1.5">
                    <label htmlFor="student-grade" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</label>
                    <div className="relative">
                      <input 
                        id="student-grade"
                        type="number" 
                        min="0" 
                        max={assignment.totalMarks}
                        placeholder="0"
                        value={gradeInput}
                        onChange={e => setGradeInput(e.target.value)}
                        className="input-premium h-12 text-base font-black px-4"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        / {assignment.totalMarks}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-8 space-y-1.5">
                    <label htmlFor="student-feedback" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feedback & Comments</label>
                    <input 
                      id="student-feedback"
                      placeholder="Add assessment remarks..."
                      value={feedbackInput}
                      onChange={e => setFeedbackInput(e.target.value)}
                      className="input-premium h-12 text-sm font-medium px-4"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button 
                    onClick={() => setSelectedSubmission(null)}
                    className="btn btn-secondary text-xs uppercase tracking-wider h-11 px-5 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveGrade}
                    disabled={gradingInProgress}
                    className="btn btn-primary text-xs uppercase tracking-wider h-11 px-6 rounded-xl font-black gap-2 shadow-sm"
                  >
                    {gradingInProgress ? <Loader2 size={14} className="animate-spin" /> : null}
                    Save Grade
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Scroll to top FAB */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-2xl shadow-slate-900/30 flex items-center justify-center hover:bg-primary-600 hover:-translate-y-1 active:scale-95 transition-all duration-300"
        >
          <ChevronUp size={22} strokeWidth={2.5} />
        </button>
      )}

    </div>
  );
}
