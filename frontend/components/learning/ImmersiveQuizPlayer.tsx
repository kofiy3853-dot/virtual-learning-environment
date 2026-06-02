'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CheckCircle2, ChevronLeft, ChevronRight, 
  AlertTriangle, Send, Loader2, Sparkles,
  List, LayoutGrid, Flag
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  totalMarks?: number;
}

interface Attempt {
  _id: string;
  startTime?: string;
  startedAt?: string;
  status?: string;
}

interface Question {
  _id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  marks: number;
}

interface ImmersiveQuizPlayerProps {
  quiz: Quiz;
  questions: Question[];
  attempt: Attempt;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  timeLeft: number | null;
}

// ─── Timer Display ───────────────────────────────────────────────────────────

function TimerDisplay({ timeLeft }: { timeLeft: number | null }) {
  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return h > 0
      ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
      : `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const isWarning = timeLeft !== null && timeLeft < 300000; // < 5 min
  const isCritical = timeLeft !== null && timeLeft < 60000;  // < 1 min

  return (
    <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all ${
      isCritical 
        ? 'bg-rose-600 border-rose-500 text-white animate-pulse shadow-xl shadow-rose-500/30'
        : isWarning 
          ? 'bg-amber-50 border-amber-300 text-amber-700'
          : 'bg-slate-50 border-slate-200 text-slate-700'
    }`}>
      <Clock size={18} className={isCritical ? 'text-white' : isWarning ? 'text-amber-500' : 'text-slate-400'} />
      <span className="text-xl font-black font-mono leading-none tracking-tight">
        {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
      </span>
      {isWarning && !isCritical && (
        <AlertTriangle size={16} className="text-amber-500" />
      )}
    </div>
  );
}

// ─── Question Palette ────────────────────────────────────────────────────────

function QuestionPalette({ 
  questions, answers, currentIdx, onJump 
}: { 
  questions: Question[], 
  answers: Record<string, string>, 
  currentIdx: number,
  onJump: (i: number) => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Question Navigator</p>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, i) => {
          const isAnswered = !!answers[q._id];
          const isCurrent = i === currentIdx;
          return (
            <button
              key={q._id}
              onClick={() => onJump(i)}
              title={`Question ${i + 1}${isAnswered ? ' — Answered' : ' — Unanswered'}`}
              aria-label={`Go to question ${i + 1}`}
              className={`aspect-square rounded-xl text-xs font-black transition-all ${
                isCurrent
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 scale-110'
                  : isAnswered
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-300" />
          <span className="text-[10px] font-bold text-slate-400">Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-slate-200 border border-slate-300" />
          <span className="text-[10px] font-bold text-slate-400">Skipped</span>
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation Screen ─────────────────────────────────────────────────────

function ConfirmScreen({
  questions,
  answers,
  onBack,
  onSubmit,
  isSubmitting,
  onJump,
}: {
  questions: Question[];
  answers: Record<string, string>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onJump: (i: number) => void;
}) {
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const unansweredIndices = questions
    .map((q, i) => (!answers[q._id] ? i : null))
    .filter((i): i is number => i !== null);

  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* Readiness Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary-100">
          <Sparkles size={32} />
        </div>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Ready to Submit?</h3>
        <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
          Review your progress below before committing your final answers.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
          <p className="text-3xl font-black text-slate-900 mb-1">{questions.length}</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center shadow-sm">
          <p className="text-3xl font-black text-emerald-600 mb-1">{answeredCount}</p>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Answered</p>
        </div>
        <div className={`rounded-2xl border p-6 text-center shadow-sm ${
          unansweredCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <p className={`text-3xl font-black mb-1 ${unansweredCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{unansweredCount}</p>
          <p className={`text-[10px] font-black uppercase tracking-widest ${unansweredCount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>Skipped</p>
        </div>
      </div>

      {/* Unanswered Warning */}
      {unansweredCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertTriangle size={20} />
            <span className="font-black text-sm uppercase tracking-wider">Unanswered Questions</span>
          </div>
          <p className="text-amber-700 text-sm font-medium">
            You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. 
            Blank answers score zero. You can still go back to answer them.
          </p>
          <div className="flex flex-wrap gap-2">
            {unansweredIndices.map(i => (
              <button
                key={i}
                onClick={() => { onBack(); onJump(i); }}
                className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 text-xs font-black hover:bg-amber-200 transition-colors"
              >
                Q{i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 h-14 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:border-slate-300 transition-all"
        >
          Review Answers
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-[2] h-14 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          {isSubmitting ? 'Submitting...' : 'Commit Final Submission'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ImmersiveQuizPlayer({ quiz, questions, attempt, onSubmit, timeLeft }: ImmersiveQuizPlayerProps) {
  const { user } = useAuth();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Restore saved draft from localStorage on mount
    try {
      const saved = localStorage.getItem(`quiz-draft-${attempt._id}`);
      if (saved) return JSON.parse(saved) as Record<string, string>;
    } catch {
      // ignore parse errors
    }
    return {};
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // Use a ref so the auto-submit effect always reads the latest answers/isSubmitting
  const answersRef = React.useRef(answers);
  const isSubmittingRef = React.useRef(isSubmitting);
  answersRef.current = answers;
  isSubmittingRef.current = isSubmitting;

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  // Guard: questions not loaded yet
  if (!questions.length || !currentQ) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <p className="text-sm text-slate-500">Loading questions...</p>
        </div>
      </div>
    );
  }

  const handleFinalSubmit = async () => {
    if (isSubmittingRef.current) return; // prevent duplicate submits
    setIsSubmitting(true);
    await onSubmit(answersRef.current);
    // Remove the draft from localStorage after successful submit
    try {
      localStorage.removeItem(`quiz-draft-${attempt._id}`);
    } catch {
      // ignore
    }
    setIsSubmitting(false);
  };

  // Auto-save answers to localStorage (throttled to at most every 30 seconds)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(`quiz-draft-${attempt._id}`, JSON.stringify(answers));
      } catch {
        // ignore storage errors
      }
    }, 30_000);
    return () => clearTimeout(id);
  }, [answers, attempt._id]);

  // Auto-submit when time runs out — uses refs to avoid stale closure
  useEffect(() => {
    if (timeLeft === 0 && !isSubmittingRef.current) {
      void handleFinalSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const setAnswer = useCallback((val: string) => {
    setAnswers(prev => ({ ...prev, [currentQ._id]: val }));
  }, [currentQ]);

  const handleNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(i => i + 1);
    else setShowConfirm(true);
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      if (next.has(currentIdx)) next.delete(currentIdx);
      else next.add(currentIdx);
      return next;
    });
  };



  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col font-sans z-50">

      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-10 flex items-center justify-between shrink-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1 truncate max-w-xs">{quiz.title}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Question {currentIdx + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Question palette toggle */}
          <button
            onClick={() => setShowPalette(v => !v)}
            title="Toggle question palette"
            aria-label="Toggle question palette"
            className={`flex items-center gap-2 h-10 px-4 rounded-xl border font-black text-xs uppercase tracking-wider transition-all ${
              showPalette ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Navigator</span>
          </button>

          {/* TIMER — always visible, prominent */}
          <TimerDisplay timeLeft={timeLeft} />
        </div>
      </header>

      {/* ── PROGRESS BAR ──────────────────────────────────────────────── */}
      <div className="h-1 w-full bg-slate-100 shrink-0">
        <motion.div
          className="h-full bg-primary-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ ease: 'easeOut' }}
        />
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Question Palette Sidebar (desktop) */}
        <AnimatePresence>
          {showPalette && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white border-r border-slate-200 overflow-y-auto shrink-0 hidden md:block"
            >
              <div className="p-6">
                <QuestionPalette
                  questions={questions}
                  answers={answers}
                  currentIdx={currentIdx}
                  onJump={(i) => { setCurrentIdx(i); setShowConfirm(false); }}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center p-6 md:p-16">
            <div className="w-full max-w-2xl">
              <AnimatePresence mode="wait">
                {!showConfirm ? (
                  <motion.div
                    key={currentQ._id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 250 }}
                    className="space-y-10"
                  >
                    {/* Question Header */}
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="px-3 py-1 rounded-lg bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest border border-primary-100">
                            Q{currentIdx + 1} / {questions.length}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {currentQ.marks} mark{currentQ.marks !== 1 ? 's' : ''}
                          </span>
                          {flagged.has(currentIdx) && (
                            <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                              Flagged
                            </span>
                          )}
                        </div>
                        <button
                          onClick={toggleFlag}
                          title={flagged.has(currentIdx) ? 'Remove flag' : 'Flag for review'}
                          aria-label={flagged.has(currentIdx) ? 'Remove flag from this question' : 'Flag this question for review'}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                            flagged.has(currentIdx)
                              ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                              : 'bg-white border-slate-200 text-slate-400 hover:border-amber-200 hover:text-amber-500'
                          }`}
                        >
                          <Flag size={12} />
                          Flag
                        </button>
                      </div>

                      <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight">
                        {currentQ.text}
                      </h2>
                    </div>

                    {/* ─ MCQ ─ */}
                    {currentQ.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        {currentQ.options?.map((opt, i) => {
                          const selected = answers[currentQ._id] === String(i);
                          return (
                            <button
                              key={i}
                              onClick={() => setAnswer(String(i))}
                              className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all group ${
                                selected
                                  ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-600/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-primary-200 hover:bg-primary-50/30'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all ${
                                selected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                              }`}>
                                {String.fromCharCode(65 + i)}
                              </div>
                              <span className="text-base font-semibold leading-snug">{opt}</span>
                              {selected && (
                                <CheckCircle2 size={20} className="ml-auto shrink-0 text-white/80" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* ─ True / False ─ */}
                    {currentQ.type === 'true_false' && (
                      <div className="grid grid-cols-2 gap-4">
                        {['true', 'false'].map(val => {
                          const selected = answers[currentQ._id] === val;
                          return (
                            <button
                              key={val}
                              onClick={() => setAnswer(val)}
                              className={`flex flex-col items-center gap-4 py-10 rounded-2xl border-2 font-black text-lg uppercase tracking-widest transition-all ${
                                selected
                                  ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-600/20'
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-primary-300'
                              }`}
                            >
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                selected ? 'bg-white/20' : 'bg-slate-50'
                              }`}>
                                {val === 'true'
                                  ? <CheckCircle2 size={28} className={selected ? 'text-white' : 'text-slate-300'} />
                                  : <XCircle size={28} className={selected ? 'text-white' : 'text-slate-300'} />
                                }
                              </div>
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* ─ Short Answer ─ */}
                    {currentQ.type === 'short_answer' && (
                      <div className="space-y-3">
                        <label htmlFor={`q-${currentQ._id}`} className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          Your Response
                        </label>
                        <textarea
                          id={`q-${currentQ._id}`}
                          rows={7}
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl p-6 text-lg font-medium text-slate-900 focus:border-primary-500 outline-none resize-none transition-all shadow-sm"
                          placeholder="Type your answer here..."
                          value={answers[currentQ._id] || ''}
                          onChange={e => setAnswer(e.target.value)}
                        />
                        <p className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                          {(answers[currentQ._id] || '').split(' ').filter(Boolean).length} words
                        </p>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-4 pt-4">
                      <button
                        onClick={handlePrev}
                        disabled={currentIdx === 0}
                        aria-label="Previous question"
                        className="flex items-center gap-2 px-6 h-14 rounded-2xl bg-white border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-widest hover:border-slate-300 transition-all disabled:opacity-0"
                      >
                        <ChevronLeft size={18} /> Back
                      </button>

                      <button
                        onClick={handleNext}
                        aria-label={currentIdx === questions.length - 1 ? 'Review & Submit' : 'Next question'}
                        className="flex items-center gap-2 px-8 h-14 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 group"
                      >
                        {currentIdx === questions.length - 1 ? 'Review & Submit' : 'Next'}
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <ConfirmScreen
                    questions={questions}
                    answers={answers}
                    onBack={() => setShowConfirm(false)}
                    onSubmit={handleFinalSubmit}
                    isSubmitting={isSubmitting}
                    onJump={(i) => { setCurrentIdx(i); setShowConfirm(false); }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      {/* ── MOBILE PALETTE BOTTOM SHEET ───────────────────────────────── */}
      <AnimatePresence>
        {showPalette && (
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 rounded-t-3xl p-6 z-50 md:hidden shadow-2xl"
          >
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-6" />
            <QuestionPalette
              questions={questions}
              answers={answers}
              currentIdx={currentIdx}
              onJump={(i) => { setCurrentIdx(i); setShowConfirm(false); setShowPalette(false); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="h-14 bg-white border-t border-slate-200 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto-Save Active</span>
        </div>
        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {user?.name} · {answeredCount}/{questions.length} answered
        </div>
      </footer>
    </div>
  );
}

// ─── XCircle inline SVG (avoids lucide-react deprecation) ──────────────────

function XCircle({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg {...props} width={size} height={size} xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
  );
}
