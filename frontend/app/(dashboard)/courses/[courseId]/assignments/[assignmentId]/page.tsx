'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Loader2, AlertCircle, FileText, X,
  ArrowLeft, Users, ExternalLink,
  Calendar, Award, ChevronUp
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
  student: { _id: string; name: string };
  submittedAt: string;
  textContent?: string;
  files?: string[];
  fileUrls?: string[];
  status: 'submitted' | 'graded' | 'late';
  grade?: number;
  feedback?: string;
}

export default function AssignmentDetailPage() {
  const { courseId, assignmentId } = useParams() as { courseId: string; assignmentId: string };
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('overview');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradingInProgress, setGradingInProgress] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    const onScroll = () => setShowScrollTop(mainEl.scrollTop > 300);
    mainEl.addEventListener('scroll', onScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!assignmentId) return;
      try {
        const aRes = await courseApi.getAssignment(assignmentId);
        if (!active) return;
        setAssignment(aRes.data.data);

        if (isStudent) {
          try {
            const sRes = await courseApi.getMySubmission(assignmentId);
            if (!active) return;
            const sub = sRes.data.data;
            if (sub) setSubmission({ ...sub, files: sub.fileUrls || sub.files || [] });
          } catch { /* no submission yet */ }
        }

        if (isTeacher) {
          try {
            const sRes = await courseApi.getSubmissions(assignmentId);
            if (!active) return;
            setAllSubmissions(
              (sRes.data.data || []).map((s: Submission) => ({ ...s, files: s.fileUrls || s.files || [] }))
            );
          } catch { /* no submissions */ }
        }
      } catch {
        toast.error('Failed to load assignment.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [assignmentId, isStudent, isTeacher]);

  const handleFinalSubmit = async (textContent: string, files: File[]) => {
    const fd = new FormData();
    fd.append('textContent', textContent);
    files.forEach(f => fd.append('files', f));
    try {
      const res = await courseApi.submitAssignment(assignmentId, fd);
      const sub = res.data.data;
      setSubmission({ ...sub, files: sub.fileUrls || sub.files || [] });
      toast.success('Assignment submitted successfully.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to submit.');
    }
  };

  const openGradingModal = (sub: Submission) => {
    setSelectedSubmission(sub);
    setGradeInput(sub.grade !== undefined ? String(sub.grade) : '');
    setFeedbackInput(sub.feedback || '');
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission || !assignment) return;
    const num = Number(gradeInput);
    if (isNaN(num) || num < 0 || num > assignment.totalMarks) {
      toast.error(`Grade must be between 0 and ${assignment.totalMarks}.`);
      return;
    }
    setGradingInProgress(true);
    try {
      await courseApi.gradeSubmission(selectedSubmission._id, { grade: num, feedback: feedbackInput });
      setAllSubmissions(prev =>
        prev.map(s => s._id === selectedSubmission._id ? { ...s, grade: num, feedback: feedbackInput, status: 'graded' } : s)
      );
      toast.success('Grade saved.');
      setSelectedSubmission(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to save grade.');
    } finally {
      setGradingInProgress(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh] gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      <span className="text-sm text-slate-500">Loading assignment...</span>
    </div>
  );

  if (!assignment) return (
    <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h3 className="text-base font-semibold text-slate-900 mb-1">Assignment Not Found</h3>
      <p className="text-sm text-slate-500 mb-4">This assignment may have been deleted.</p>
      <Link href={`/courses/${courseId}/assignments`} className="btn btn-secondary btn-sm">Back to Assignments</Link>
    </div>
  );

  const gradedCount = allSubmissions.filter(s => s.status === 'graded').length;
  const gradingProgress = allSubmissions.length > 0 ? Math.round((gradedCount / allSubmissions.length) * 100) : 0;
  const isPastDue = new Date(assignment.dueDate) < new Date();

  return (
    <div className="space-y-5 pb-10">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/courses/${courseId}/assignments`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 font-medium transition-colors"
        >
          <ArrowLeft size={15} /> Assignments
        </Link>
        {isTeacher && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                activeTab === 'submissions'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Submissions ({allSubmissions.length})
            </button>
          </div>
        )}
      </div>

      {/* Assignment Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-slate-900">{assignment.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" />
                Due {format(new Date(assignment.dueDate), 'PPP p')}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1">
                <Award size={13} className="text-slate-400" />
                {assignment.totalMarks} pts
              </span>
              {isPastDue && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-rose-500 font-semibold">Past Due</span>
                </>
              )}
            </div>
          </div>
          {isStudent && submission && (
            <span className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border ${
              submission.status === 'graded'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              {submission.status === 'graded' ? 'Graded' : 'Submitted'}
            </span>
          )}
        </div>
      </div>

      {/* STUDENT VIEW */}
      {isStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Instructions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3 pb-3 border-b border-slate-100">Instructions</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {assignment.description || 'No additional instructions provided.'}
              </p>
            </div>
            {/* Submission */}
            <SubmissionStudio assignment={assignment} submission={submission} onSubmit={handleFinalSubmit} />
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide pb-3 border-b border-slate-100">Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Due Date</p>
                  <p className="text-sm font-semibold text-slate-800">{format(new Date(assignment.dueDate), 'PPP p')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Total Marks</p>
                  <p className="text-sm font-semibold text-slate-800">{assignment.totalMarks} pts</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                    submission
                      ? submission.status === 'graded'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                      : isPastDue
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {submission
                      ? submission.status === 'graded' ? 'Graded' : 'Submitted'
                      : isPastDue ? 'Overdue' : 'Pending'}
                  </span>
                </div>
                {submission?.status === 'graded' && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Your Grade</p>
                    <p className="text-lg font-bold text-slate-900">
                      {submission.grade} <span className="text-sm text-slate-400 font-normal">/ {assignment.totalMarks}</span>
                    </p>
                    <p className="text-xs text-primary-600 font-semibold">
                      {Math.round(((submission.grade ?? 0) / assignment.totalMarks) * 100)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* TEACHER VIEW */}
      {isTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {activeTab === 'overview' ? (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-3 pb-3 border-b border-slate-100">Assignment Description</h2>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {assignment.description || 'No description provided.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-900">Submissions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{allSubmissions.length} student{allSubmissions.length !== 1 ? 's' : ''} submitted</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Student', 'Submitted', 'Status', 'Grade', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-sm text-slate-400">No submissions yet.</td>
                        </tr>
                      ) : allSubmissions.map(sub => (
                        <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {sub.student?.name?.charAt(0)}
                              </div>
                              <span className="text-sm font-semibold text-slate-900">{sub.student?.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{format(new Date(sub.submittedAt), 'MMM d, yyyy')}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              sub.status === 'graded'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {sub.status === 'graded' ? 'Graded' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                            {sub.grade !== undefined ? `${sub.grade} / ${assignment.totalMarks}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => openGradingModal(sub)}
                              className="btn btn-secondary btn-sm text-xs"
                            >
                              {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Teacher Sidebar */}
          <aside className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide pb-3 border-b border-slate-100">Overview</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Due Date</p>
                  <p className="text-sm font-semibold text-slate-800">{format(new Date(assignment.dueDate), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Total Marks</p>
                  <p className="text-sm font-semibold text-slate-800">{assignment.totalMarks} pts</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Submissions</p>
                  <p className="text-sm font-semibold text-slate-800">{allSubmissions.length} received</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Grading Progress</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${gradingProgress}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{gradedCount}/{allSubmissions.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Grading Modal */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setSelectedSubmission(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              className="relative bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-5 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Grade Submission</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Users size={11} /> {selectedSubmission.student?.name}
                  </p>
                </div>
                <button onClick={() => setSelectedSubmission(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Submission content */}
              <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-premium">
                {selectedSubmission.textContent && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Response</p>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {selectedSubmission.textContent}
                    </div>
                  </div>
                )}
                {(selectedSubmission.files || selectedSubmission.fileUrls || []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Files</p>
                    <div className="space-y-2">
                      {(selectedSubmission.files || selectedSubmission.fileUrls || []).map((url: string, i: number) => {
                        const name = url.split('/').pop()?.split('-').slice(1).join('-') || `File ${i + 1}`;
                        return (
                          <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-slate-400" />
                              <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{name}</span>
                            </div>
                            <a href={url.startsWith('http') ? url : `http://localhost:5000/${url}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary-600 transition-colors">
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Grade inputs */}
              <div className="grid grid-cols-5 gap-3 pt-2 border-t border-slate-100">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Score</label>
                  <div className="relative">
                    <input
                      type="number" min="0" max={assignment.totalMarks}
                      placeholder="0"
                      value={gradeInput}
                      onChange={e => setGradeInput(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">/{assignment.totalMarks}</span>
                  </div>
                </div>
                <div className="col-span-3 space-y-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Feedback</label>
                  <input
                    placeholder="Optional feedback..."
                    value={feedbackInput}
                    onChange={e => setFeedbackInput(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setSelectedSubmission(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={handleSaveGrade} disabled={gradingInProgress} className="btn btn-primary btn-sm gap-1.5">
                  {gradingInProgress && <Loader2 size={13} className="animate-spin" />}
                  Save Grade
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 w-9 h-9 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
        >
          <ChevronUp size={16} />
        </button>
      )}
    </div>
  );
}
