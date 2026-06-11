'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { quizApi } from '@/utils/api/extraApis';
import { useQuizDetail, type QuizAttempt } from '@/hooks/queries/useQuizDetail';
import { queryKeys } from '@/lib/queryKeys';
import ImmersiveQuizPlayer from '@/components/learning/ImmersiveQuizPlayer';
import {
  Clock, Play, Loader2,
  CheckCircle2, XCircle, Plus, Trash2, AlertCircle,
  Target, ChevronLeft, TrendingUp, Users, List,
  Pencil, Save, Upload, Download, FileSpreadsheet, X
} from 'lucide-react';
import Link from 'next/link';
import { Quiz, Course } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AnswerResult {
  questionId: string;
  correct: boolean | null;
  studentAnswer?: string;
  correctAnswer?: string | null;
}

interface Question {
  _id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  marks: number;
}

export default function QuizDetailPage() {
  const { courseId, quizId } = useParams() as { courseId: string; quizId: string };
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const { data, isLoading, isError } = useQuizDetail(quizId, { isStudent, isTeacher });

  const quiz = data?.quiz ?? null;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  const [starting, setStarting] = useState(false);
  const [showQForm, setShowQForm] = useState(false);
  const autoOpened = useRef(false);
  const [addingQ, setAddingQ] = useState(false);
  const [answerResults, setAnswerResults] = useState<AnswerResult[]>([]);
  const [gradingAttempt, setGradingAttempt] = useState<QuizAttempt | null>(null);
  const [gradeForm, setGradeForm] = useState({ scoreAdjustment: '', feedback: '' });
  const [gradeFormError, setGradeFormError] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Edit / Delete quiz state
  const [showEditForm, setShowEditForm] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingQuiz, setDeletingQuiz] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    duration: 30,
    totalMarks: 100,
    startTime: '',
    endTime: '',
  });

  // Bulk Upload State
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkQuestions, setBulkQuestions] = useState<any[]>([]);
  const [bulkUploadError, setBulkUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [qForm, setQForm] = useState({
    text: '',
    type: 'multiple_choice' as 'multiple_choice' | 'true_false' | 'short_answer',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 5,
  });

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const courseData = quiz?.course as Course | undefined;
  const teacherId = typeof courseData?.teacher === 'object' ? courseData.teacher._id : courseData?.teacher;
  const isOwner = isTeacher && (teacherId === user?._id || user?.role === 'admin');

  useEffect(() => {
    if (!data) return;
    setQuestions(data.questions as Question[]);
    setAttempt(data.attempt);
    // If the attempt includes answerResults from the server, set them
    if (data.attempt?.answerResults) {
      setAnswerResults(data.attempt.answerResults as AnswerResult[]);
    }
    setAllAttempts(data.allAttempts);
    // Pre-populate edit form whenever quiz data loads
    if (data.quiz) {
      const q = data.quiz;
      setEditForm({
        title: q.title ?? '',
        description: q.description ?? '',
        duration: q.duration ?? 30,
        totalMarks: q.totalMarks ?? 100,
        startTime: q.startTime ? new Date(q.startTime).toISOString().slice(0, 16) : '',
        endTime: q.endTime ? new Date(q.endTime).toISOString().slice(0, 16) : '',
      });
    }
    if (user?.role === 'teacher' && data.questions.length === 0 && !autoOpened.current) {
      setShowQForm(true);
      autoOpened.current = true;
    }
  }, [data, user?.role]);

  useEffect(() => {
    if (isError) router.push(`/courses/${courseId}/quizzes`);
  }, [isError, router, courseId]);

  const invalidateQuiz = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.detail(quizId) });
  }, [queryClient, quizId]);

  const handleDeleteQuiz = async () => {
    if (!confirm('Are you sure you want to delete this quiz? This cannot be undone.')) return;
    setDeletingQuiz(true);
    try {
      await quizApi.deleteQuiz(quizId);
      toast.success('Quiz deleted');
      router.push(`/courses/${courseId}/quizzes`);
    } catch {
      toast.error('Failed to delete quiz');
      setDeletingQuiz(false);
    }
  };

  const handleUpdateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await quizApi.updateQuiz(quizId, {
        title: editForm.title,
        description: editForm.description,
        duration: Number(editForm.duration),
        totalMarks: Number(editForm.totalMarks),
        startTime: editForm.startTime ? new Date(editForm.startTime).toISOString() : undefined,
        endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : undefined,
      } as Partial<Quiz>);
      invalidateQuiz();
      setShowEditForm(false);
      toast.success('Quiz updated successfully');
    } catch {
      toast.error('Failed to update quiz');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await quizApi.startAttempt(quizId);
      const { attempt: newAttempt, questions: startQuestions } = res.data.data;
      // Ensure questions are in state before mounting the player
      if (startQuestions?.length) {
        setQuestions(startQuestions);
      } else {
        // Fallback: fetch questions separately before mounting player
        const qRes = await quizApi.getQuestions(quizId);
        setQuestions(qRes.data.data);
      }
      setAttempt(newAttempt);
      invalidateQuiz();
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to start quiz');
    } finally {
      setStarting(false);
    }
  };

  const handleFinalSubmit = useCallback(async (answers: Record<string, string>) => {
    try {
      const answersArr = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      const res = await quizApi.submitAttempt(quizId, { answers: answersArr });
      const responseData = res.data.data;
      setAttempt(responseData);
      if (responseData.answerResults) {
        setAnswerResults(responseData.answerResults);
      }
      invalidateQuiz();
      toast.success('Quiz submitted successfully');
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to submit quiz');
    }
  }, [quizId, invalidateQuiz]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || !quiz) return;
    const startedAt = attempt.startedAt ?? attempt.startTime;
    if (!startedAt) return;
    const deadline = new Date(startedAt).getTime() + quiz.duration * 60000;
    const tick = setInterval(() => {
      const left = Math.max(0, deadline - Date.now());
      setTimeLeft(left);
      if (left === 0) { clearInterval(tick); }
    }, 1000);
    return () => clearInterval(tick);
  }, [attempt, quiz, handleFinalSubmit]);

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await quizApi.deleteQuestion(questionId);
      setQuestions(p => p.filter(q => q._id !== questionId));
      invalidateQuiz();
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const handlePublishToggle = async () => {
    try {
      await quizApi.publishQuiz(quizId);
      invalidateQuiz();
      toast.success(quiz?.isPublished ? 'Quiz unpublished' : 'Quiz published');
    } catch {
      toast.error('Failed to update quiz status');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingQ(true);
    try {
      const payload: Record<string, unknown> = {
        ...qForm,
        marks: parseInt(qForm.marks.toString()),
        order: questions.length + 1,
      };
      if (qForm.type === 'multiple_choice') {
        payload.options = qForm.options.filter(o => o.trim());
      } else {
        delete payload.options;
      }
      await quizApi.addQuestion(quizId, payload as any);
      invalidateQuiz();
      setQForm({ text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', marks: 5 });
      setShowQForm(false);
      toast.success('Question added');
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to add question');
    } finally {
      setAddingQ(false);
    }
  };

  const handleBulkFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBulkUploadError('');
    setBulkQuestions([]);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: any[] = [];
        
        if (file.name.endsWith('.json')) {
          parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error('JSON must contain an array of questions');
        } else if (file.name.endsWith('.csv')) {
          // Simple CSV parser
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
          const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
          
          parsed = lines.slice(1).map((line, index) => {
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
            const obj: any = {};
            
            headers.forEach((header, i) => {
              let val = values[i] ? values[i].replace(/(^"|"$)/g, '').trim() : '';
              if (header === 'options') {
                 obj[header] = val ? val.split('|').map(o => o.trim()) : [];
              } else if (header === 'marks') {
                 obj[header] = parseInt(val, 10) || 1;
              } else {
                 obj[header] = val;
              }
            });
            return obj;
          });
        } else {
          throw new Error('Unsupported file format. Please use .csv or .json');
        }

        setBulkQuestions(parsed);
      } catch (err: any) {
        setBulkUploadError(err.message || 'Failed to parse file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBulkUploadSubmit = async () => {
    if (bulkQuestions.length === 0) return;
    setIsUploading(true);
    try {
      await quizApi.bulkAddQuestions(quizId, bulkQuestions);
      invalidateQuiz();
      setShowBulkUpload(false);
      setBulkQuestions([]);
      toast.success(`Successfully added ${bulkQuestions.length} questions`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to bulk upload questions');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "text,type,marks,correctAnswer,options\n" + 
      "What is 2+2?,multiple_choice,5,4,3|4|5|6\n" +
      "The earth is flat,true_false,2,false,\n" +
      "Name the capital of France,short_answer,10,,";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'quiz_questions_template.csv';
    link.click();
  };

  if (isLoading || !quiz) return (
    <div className="flex items-center justify-center min-h-[40vh] gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      <span className="text-sm text-slate-500">Loading quiz...</span>
    </div>
  );

  // Student in active attempt — full screen player
  if (isStudent && attempt?.status === 'in_progress' && questions.length > 0) {
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

  // Questions still loading for an active attempt
  if (isStudent && attempt?.status === 'in_progress' && questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="text-sm text-slate-500">Loading questions...</span>
      </div>
    );
  }

  const now = new Date();
  const isAvailable = !quiz.startTime || !quiz.endTime || (
    now >= new Date(quiz.startTime) && now <= new Date(quiz.endTime)
  );

  return (
    <div className="space-y-5 pb-10">

      {/* Breadcrumb */}
      <Link
        href={`/courses/${courseId}/quizzes`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 font-medium transition-colors"
      >
        <ChevronLeft size={15} /> Quizzes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-sm text-slate-500 leading-relaxed">{quiz.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-1">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-slate-400" /> {quiz.duration} min
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1">
                <Target size={13} className="text-slate-400" /> {quiz.totalMarks} pts
              </span>
              {quiz.startTime && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{format(new Date(quiz.startTime), 'MMM d')} – {format(new Date(quiz.endTime), 'MMM d, yyyy')}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
              quiz.isPublished
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {quiz.isPublished ? 'Published' : 'Draft'}
            </span>
            {isOwner && (
              <>
                <button
                  onClick={() => setShowEditForm(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    showEditForm
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
                  }`}
                  title="Edit quiz details"
                >
                  <Pencil size={12} />
                  {showEditForm ? 'Cancel Edit' : 'Edit'}
                </button>
                <button
                  onClick={handleDeleteQuiz}
                  disabled={deletingQuiz}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                  title="Delete quiz"
                >
                  {deletingQuiz ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Inline Edit Form */}
      <AnimatePresence>
        {showEditForm && isOwner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <form
              onSubmit={handleUpdateQuiz}
              className="bg-white rounded-xl border border-primary-200 p-5 shadow-sm space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Pencil size={14} className="text-primary-600" /> Edit Quiz Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="eq-title" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Title *</label>
                  <input
                    id="eq-title"
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label htmlFor="eq-desc" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Description</label>
                  <textarea
                    id="eq-desc"
                    rows={2}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none"
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="eq-duration" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Duration (minutes) *</label>
                  <input
                    id="eq-duration"
                    type="number"
                    min={1}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                    value={editForm.duration}
                    onChange={e => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="eq-marks" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Total Marks *</label>
                  <input
                    id="eq-marks"
                    type="number"
                    min={1}
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                    value={editForm.totalMarks}
                    onChange={e => setEditForm({ ...editForm, totalMarks: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="eq-start" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Start Time</label>
                  <input
                    id="eq-start"
                    type="datetime-local"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                    value={editForm.startTime}
                    onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="eq-end" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">End Time</label>
                  <input
                    id="eq-end"
                    type="datetime-local"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                    value={editForm.endTime}
                    onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="btn btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary flex-[2] text-sm gap-1.5"
                >
                  {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* STUDENT: Start or Results */}
          {isStudent && (
            <>
              {!attempt ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
                  <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto">
                    <Play size={24} className="fill-primary-600 ml-0.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 mb-1">Ready to start?</h2>
                    <p className="text-sm text-slate-500">
                      Once started, the timer begins and cannot be paused. You have {quiz.duration} minutes.
                    </p>
                  </div>
                  {!isAvailable && (
                    <div className="flex items-center gap-2 justify-center text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                      <AlertCircle size={14} /> This quiz is not available right now
                    </div>
                  )}
                  <button
                    onClick={handleStart}
                    disabled={starting || !isAvailable}
                    className="btn btn-primary px-8 py-2.5 text-sm font-semibold gap-2 disabled:opacity-50"
                  >
                    {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    {starting ? 'Starting...' : 'Start Quiz'}
                  </button>
                </div>
              ) : attempt.status === 'submitted' ? (
                /* Pending manual grading */
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
                  <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto">
                    <Loader2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 mb-1">Grading in Progress</h2>
                    <p className="text-sm text-slate-500">Your short-answer responses are being reviewed by your teacher.</p>
                  </div>
                  {attempt.score !== undefined && (
                    <div className="inline-flex flex-col items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-8 py-5">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Auto-scored Points</p>
                      <p className="text-4xl font-bold text-slate-900">
                        {attempt.score}
                        <span className="text-lg text-slate-400 font-normal"> / {quiz.totalMarks}</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Graded — detailed answer review */
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Score header */}
                  <div className="p-6 text-center border-b border-slate-100 space-y-3">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto">
                      <CheckCircle2 size={24} />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900">Quiz Results</h2>
                    {attempt.score !== undefined && (
                      <div className="inline-flex flex-col items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-8 py-5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your Score</p>
                        <p className="text-4xl font-bold text-slate-900">
                          {attempt.score}
                          <span className="text-lg text-slate-400 font-normal"> / {quiz.totalMarks}</span>
                        </p>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                          <TrendingUp size={13} />
                          {Math.round((attempt.score / quiz.totalMarks) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Per-question review */}
                  {questions.length > 0 && (
                    <div className="divide-y divide-slate-100">
                      {questions.map((q, idx) => {
                        const result = answerResults.find(r => r.questionId === q._id);
                        const studentAnswer = attempt.answers?.find(
                          (a: { questionId: string; answer: string }) => a.questionId === q._id
                        );
                        return (
                          <div key={q._id} className="p-5 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">
                                <span className="text-slate-400 font-normal mr-1">Q{idx + 1}.</span>
                                {q.text}
                              </p>
                              {q.type !== 'short_answer' && result && (
                                result.correct
                                  ? <CheckCircle2 size={18} className="shrink-0 text-emerald-500 mt-0.5" />
                                  : <XCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600">
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">Your answer:</span>
                              {studentAnswer?.answer ?? <span className="italic text-slate-400">No answer</span>}
                            </p>
                            {q.type === 'short_answer' && attempt.feedback && (
                              <p className="text-sm text-primary-700 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
                                <span className="font-semibold">Feedback: </span>{attempt.feedback}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* TEACHER: Question Management */}
          {isTeacher && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Questions</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowBulkUpload(!showBulkUpload); setShowQForm(false); }}
                    className={`btn btn-sm gap-1.5 ${showBulkUpload ? 'bg-primary-50 text-primary-600 border-primary-200' : 'btn-secondary'}`}
                  >
                    <Upload size={14} /> Bulk Upload
                  </button>
                  <button
                    onClick={() => { setShowQForm(!showQForm); setShowBulkUpload(false); }}
                    className="btn btn-primary btn-sm gap-1.5"
                  >
                    <Plus size={14} /> Add Question
                  </button>
                </div>
              </div>

              {/* Bulk Upload Form */}
              <AnimatePresence>
                {showBulkUpload && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet size={16} className="text-primary-600" /> 
                          Bulk Upload Questions
                        </h3>
                        <button onClick={downloadCsvTemplate} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                          <Download size={12} /> Download CSV Template
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                          <input 
                            type="file" 
                            accept=".csv,.json" 
                            onChange={handleBulkFileSelection} 
                            className="hidden" 
                            id="bulk-upload-input" 
                          />
                          <label htmlFor="bulk-upload-input" className="cursor-pointer flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center">
                              <Upload size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">Click to select a CSV or JSON file</p>
                              <p className="text-xs text-slate-500 mt-1">Options in CSV should be separated by a pipe (|)</p>
                            </div>
                          </label>
                        </div>

                        {bulkUploadError && (
                          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>{bulkUploadError}</p>
                          </div>
                        )}

                        {bulkQuestions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-700">Preview ({bulkQuestions.length} questions)</h4>
                            <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                              <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0">
                                  <tr>
                                    <th className="px-4 py-2 font-semibold">Type</th>
                                    <th className="px-4 py-2 font-semibold">Text</th>
                                    <th className="px-4 py-2 font-semibold">Marks</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {bulkQuestions.map((q, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                      <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{q.type}</td>
                                      <td className="px-4 py-2 font-medium text-slate-800 truncate max-w-[200px]" title={q.text}>{q.text}</td>
                                      <td className="px-4 py-2 text-slate-600">{q.marks}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                               <button onClick={() => {setBulkQuestions([]); setShowBulkUpload(false);}} className="btn btn-secondary text-sm px-4">Cancel</button>
                               <button 
                                 onClick={handleBulkUploadSubmit} 
                                 disabled={isUploading}
                                 className="btn btn-primary text-sm px-4 gap-2"
                               >
                                 {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                 Upload {bulkQuestions.length} Questions
                               </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add Question Form */}
              <AnimatePresence>
                {showQForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleAddQuestion} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                      <h3 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-100">New Question</h3>

                      <div className="space-y-2">
                        <label htmlFor="q-text" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Question Text *</label>
                        <textarea
                          id="q-text"
                          required
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none min-h-[80px]"
                          placeholder="Enter your question..."
                          value={qForm.text}
                          onChange={e => setQForm({ ...qForm, text: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="q-type" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Type</label>
                          <select
                            id="q-type"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm bg-white"
                            value={qForm.type}
                            onChange={e => setQForm({ ...qForm, type: e.target.value as typeof qForm.type })}
                          >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True / False</option>
                            <option value="short_answer">Short Answer</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="q-marks" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Marks</label>
                          <input
                            id="q-marks"
                            type="number"
                            min={1}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                            value={qForm.marks}
                            onChange={e => setQForm({ ...qForm, marks: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>

                      {qForm.type === 'multiple_choice' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Options (click letter to mark correct)</label>
                          <div className="space-y-2">
                            {qForm.options.map((opt, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setQForm({ ...qForm, correctAnswer: String(i) })}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 border-2 transition-all ${
                                    qForm.correctAnswer === String(i)
                                      ? 'bg-primary-600 border-primary-600 text-white'
                                      : 'bg-white border-slate-200 text-slate-500 hover:border-primary-300'
                                  }`}
                                  title={`Mark as correct`}
                                >
                                  {String.fromCharCode(65 + i)}
                                </button>
                                <input
                                  aria-label={`Option ${String.fromCharCode(65 + i)}`}
                                  className={`flex-1 px-3 py-2 border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm ${
                                    qForm.correctAnswer === String(i) ? 'border-primary-300 bg-primary-50' : 'border-slate-200'
                                  }`}
                                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                  value={opt}
                                  onChange={e => {
                                    const o = [...qForm.options];
                                    o[i] = e.target.value;
                                    setQForm({ ...qForm, options: o });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {qForm.type === 'true_false' && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Correct Answer</label>
                          <div className="flex gap-3">
                            {['true', 'false'].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setQForm({ ...qForm, correctAnswer: val })}
                                className={`flex-1 py-2.5 rounded-lg border-2 font-semibold text-sm capitalize transition-all ${
                                  qForm.correctAnswer === val
                                    ? 'bg-primary-600 border-primary-600 text-white'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setShowQForm(false)} className="btn btn-secondary flex-1 text-sm">Cancel</button>
                        <button type="submit" disabled={addingQ} className="btn btn-primary flex-[2] text-sm gap-1.5">
                          {addingQ ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                          Add Question
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Question List */}
              {questions.length === 0 && !showQForm ? (
                <div className="py-10 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <List size={20} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No questions yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add questions to build this quiz</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <motion.div
                      key={q._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:border-slate-300 hover:shadow-sm transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-semibold flex items-center justify-center text-xs shrink-0 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{q.text}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                            {q.type.replace('_', ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-primary-50 border border-primary-100 text-[10px] font-semibold text-primary-600">
                            {q.marks} pts
                          </span>
                        </div>
                      </div>
                      <button
                        aria-label="Delete question"
                        onClick={() => handleDeleteQuestion(q._id)}
                        className="w-8 h-8 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Quiz Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide pb-3 border-b border-slate-100">Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Questions</p>
                <p className="text-sm font-semibold text-slate-800">{questions.length}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Duration</p>
                <p className="text-sm font-semibold text-slate-800">{quiz.duration} minutes</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Total Marks</p>
                <p className="text-sm font-semibold text-slate-800">{quiz.totalMarks} pts</p>
              </div>
              {quiz.startTime && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Available</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {format(new Date(quiz.startTime), 'MMM d')} – {format(new Date(quiz.endTime), 'MMM d')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                  quiz.isPublished
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {quiz.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={handlePublishToggle}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-all border mt-2 ${
                  quiz.isPublished
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {quiz.isPublished ? 'Unpublish' : 'Publish Quiz'}
              </button>
            )}
          </div>

          {/* Attempts (Teacher) */}
          {isTeacher && allAttempts.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Submissions</h3>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Users size={12} /> {allAttempts.length}
                </div>
              </div>
              <div className="space-y-3">
                {allAttempts.slice(0, 5).map((a) => (
                  <div key={a._id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {a.student?.name?.charAt(0) ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate max-w-[100px]">{a.student?.name ?? 'Student'}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{a.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-bold text-slate-700">
                        {a.score !== undefined && a.score !== null ? a.score : (a.status === 'in_progress' ? '—' : 0)}
                        <span className="text-xs text-slate-400 font-normal"> /{quiz.totalMarks}</span>
                      </p>
                      {a.status === 'submitted' && (
                        <button
                          onClick={() => {
                            setGradingAttempt(a);
                            setGradeForm({ scoreAdjustment: '', feedback: '' });
                            setGradeFormError('');
                          }}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-100 transition-colors"
                          title="Grade this attempt"
                        >
                          Grade
                        </button>
                      )}
                      {a.student?._id && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Reset ${a.student?.name ?? 'this student'}'s attempt?`)) return;
                            try {
                              await quizApi.resetAttempt(quizId, a.student!._id);
                              setAllAttempts(prev => prev.filter(att => att._id !== a._id));
                              invalidateQuiz();
                              toast.success('Attempt reset successfully');
                            } catch {
                              toast.error('Failed to reset attempt');
                            }
                          }}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                          title="Reset this student's attempt"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grading Panel */}
          {isTeacher && gradingAttempt && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Grading: {gradingAttempt.student?.name ?? 'Student'}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Review answers and provide feedback</p>
                </div>
                <button
                  onClick={() => {
                    setGradingAttempt(null);
                    setGradeForm({ scoreAdjustment: '', feedback: '' });
                    setGradeFormError('');
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Close grading panel"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
                {/* Score Summary */}
                {(gradingAttempt.score !== undefined && gradingAttempt.score !== null) && (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Current Score</span>
                    <span className="text-lg font-bold text-slate-900">
                      {gradingAttempt.score}
                      <span className="text-sm text-slate-400 font-normal"> / {quiz.totalMarks}</span>
                      <span className="ml-2 text-xs font-semibold text-primary-600">
                        ({Math.round((gradingAttempt.score / (quiz.totalMarks || 1)) * 100)}%)
                      </span>
                    </span>
                  </div>
                )}
                {/* Student Answers with correctness */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Student Answers</h4>
                  {questions.map((q, idx) => {
                    // Use rich answerResults from backend (includes correctAnswer & correct flag)
                    const result = (gradingAttempt.answerResults as AnswerResult[] | undefined)?.find(
                      r => r.questionId === q._id
                    );
                    const studentAns = result?.studentAnswer
                      ?? gradingAttempt.answers?.find(
                          (a: { questionId: string; answer: string }) => a.questionId === q._id
                        )?.answer;
                    const isCorrect = result?.correct;
                    const correctAns = result?.correctAnswer;
                    const isShortAnswer = q.type === 'short_answer';
                    return (
                      <div
                        key={q._id}
                        className={`border rounded-lg p-3 space-y-2 ${
                          isShortAnswer
                            ? 'bg-slate-50 border-slate-100'
                            : isCorrect === true
                            ? 'bg-emerald-50 border-emerald-200'
                            : isCorrect === false
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 flex-1">
                            <span className="text-slate-400 font-normal mr-1">Q{idx + 1}.</span>
                            {q.text}
                          </p>
                          {!isShortAnswer && isCorrect !== undefined && isCorrect !== null && (
                            isCorrect
                              ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                              : <XCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          <span className="font-semibold uppercase tracking-wide">Type:</span> {q.type.replace('_', ' ')}
                          <span className="ml-2 font-semibold uppercase tracking-wide">Marks:</span> {q.marks} pts
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-700">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-2">Student answered:</span>
                            <span className={`font-medium ${
                              isCorrect === true ? 'text-emerald-700' : isCorrect === false ? 'text-red-700' : 'text-slate-700'
                            }`}>
                              {studentAns || <span className="italic text-slate-400">No answer provided</span>}
                            </span>
                          </p>
                          {!isShortAnswer && correctAns !== undefined && correctAns !== null && (
                            <p className="text-sm text-slate-700">
                              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mr-2">Correct answer:</span>
                              <span className="font-medium text-emerald-700">{correctAns}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Grading Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    
                    // Validation
                    const scoreAdjustmentValue = gradeForm.scoreAdjustment.trim();
                    if (!scoreAdjustmentValue) {
                      setGradeFormError('Score adjustment is required');
                      return;
                    }
                    
                    const scoreNum = parseFloat(scoreAdjustmentValue);
                    if (isNaN(scoreNum)) {
                      setGradeFormError('Score adjustment must be a valid number');
                      return;
                    }

                    setGradeFormError('');
                    setSubmittingGrade(true);

                    try {
                      const res = await quizApi.gradeAttempt(gradingAttempt._id, {
                        scoreAdjustment: scoreNum,
                        feedback: gradeForm.feedback.trim() || undefined,
                      });

                      // Update the attempt in the list
                      setAllAttempts(prev =>
                        prev.map(a => (a._id === gradingAttempt._id ? res.data.data : a))
                      );

                      toast.success('Grading submitted successfully');
                      setGradingAttempt(null);
                      setGradeForm({ scoreAdjustment: '', feedback: '' });
                      invalidateQuiz();
                    } catch (e) {
                      const error = e as { response?: { data?: { message?: string } } };
                      toast.error(error.response?.data?.message || 'Failed to submit grade');
                    } finally {
                      setSubmittingGrade(false);
                    }
                  }}
                  className="space-y-4 pt-4 border-t border-slate-100"
                >
                  <div className="space-y-2">
                    <label htmlFor="scoreAdjustment" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Score Adjustment *
                    </label>
                    <input
                      id="scoreAdjustment"
                      type="text"
                      inputMode="decimal"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                      placeholder="Enter adjustment (e.g., 5, -2, 0)"
                      value={gradeForm.scoreAdjustment}
                      onChange={e => {
                        setGradeForm({ ...gradeForm, scoreAdjustment: e.target.value });
                        setGradeFormError('');
                      }}
                    />
                    <p className="text-xs text-slate-500">
                      Current score: {gradingAttempt.score ?? 0}. Enter positive or negative number to adjust.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="feedback" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Feedback (optional)
                    </label>
                    <textarea
                      id="feedback"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none min-h-[80px]"
                      placeholder="Provide feedback to the student..."
                      value={gradeForm.feedback}
                      onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    />
                  </div>

                  {gradeFormError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle size={14} />
                      {gradeFormError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGradingAttempt(null);
                        setGradeForm({ scoreAdjustment: '', feedback: '' });
                        setGradeFormError('');
                      }}
                      className="btn btn-secondary flex-1 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingGrade}
                      className="btn btn-primary flex-[2] text-sm gap-1.5"
                    >
                      {submittingGrade ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                      Submit Grade
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
