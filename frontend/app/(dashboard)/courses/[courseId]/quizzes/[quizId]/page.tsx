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
  CheckCircle2, Plus, Trash2, AlertCircle,
  Target, ChevronLeft, TrendingUp, Users, List
} from 'lucide-react';
import Link from 'next/link';
import { Quiz, Course } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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
    setAllAttempts(data.allAttempts);
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

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await quizApi.startAttempt(quizId);
      setAttempt(res.data.data);
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
      setAttempt(res.data.data);
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
      if (left === 0) { clearInterval(tick); handleFinalSubmit({}); }
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
      if (qForm.type === 'short_answer') delete payload.correctAnswer;

      const res = await quizApi.addQuestion(quizId, payload);
      setQuestions(p => [...p, res.data.data]);
      invalidateQuiz();
      setShowQForm(false);
      setQForm({ text: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', marks: 5 });
      toast.success('Question added');
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to add question');
    } finally {
      setAddingQ(false);
    }
  };

  if (isLoading || !quiz) return (
    <div className="flex items-center justify-center min-h-[40vh] gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      <span className="text-sm text-slate-500">Loading quiz...</span>
    </div>
  );

  // Student in active attempt — full screen player
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

  const now = new Date();
  const isAvailable = quiz.startTime && quiz.endTime
    ? now >= new Date(quiz.startTime) && now <= new Date(quiz.endTime)
    : true;

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
          <span className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border ${
            quiz.isPublished
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {quiz.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

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
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 mb-1">Quiz Submitted</h2>
                    <p className="text-sm text-slate-500">Your answers have been recorded.</p>
                  </div>
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
                  {attempt.status === 'submitted' && (
                    <p className="text-xs text-slate-400">Short answers are pending manual grading.</p>
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
                <button
                  onClick={() => setShowQForm(!showQForm)}
                  className="btn btn-primary btn-sm gap-1.5"
                >
                  <Plus size={14} /> Add Question
                </button>
              </div>

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
                  <div key={a._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {a.student?.name?.charAt(0) ?? '?'}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 truncate max-w-[100px]">{a.student?.name ?? 'Student'}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{a.status}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {a.score ?? '—'}
                      <span className="text-xs text-slate-400 font-normal"> /{quiz.totalMarks}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
