'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { 
  Plus, GripVertical, Trash2, Settings, Target,
  Save, HelpCircle, CheckSquare,
  Type, Sparkles, Loader2,
  FileText, Clock, ArrowRight, Brain, Zap, X, AlertCircle
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragOverlay
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { quizApi } from '@/utils/api/extraApis';
import { aiApi } from '@/utils/api/aiApi';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { useCourse } from '@/hooks/queries/useCourse';

// --- TYPES ---
type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  required: boolean;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

// --- SORTABLE QUESTION ITEM ---
interface QuestionSidebarItemContentProps {
  question: Question;
  isActive: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDelete: () => void;
  index: number;
  attributes?: ReturnType<typeof useSortable>['attributes'];
  listeners?: ReturnType<typeof useSortable>['listeners'];
  setNodeRef?: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
}

function QuestionSidebarItemContent({ 
  question, isActive, isDragging, onClick, onDelete, index, attributes, listeners, setNodeRef, style 
}: QuestionSidebarItemContentProps) {
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      role="button"
      tabIndex={0}
      {...(isActive ? { 'aria-pressed': 'true' } : { 'aria-pressed': 'false' })}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      className={`group flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer mb-2 ${
        isDragging
          ? 'opacity-50 bg-primary-50 border-primary-300'
          : isActive 
            ? 'bg-primary-50 border-primary-300 shadow-sm' 
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 flex-shrink-0">
        <GripVertical size={14}/>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900 truncate">{question.text || `Question ${index + 1}`}</p>
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{question.type.replace('_', ' ')} • {question.marks}pts</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 flex-shrink-0"
        title="Delete question"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function QuestionSidebarItem({ question, isActive, onClick, onDelete, index }: { question: Question, isActive: boolean, onClick: () => void, onDelete: () => void, index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return <QuestionSidebarItemContent {...{ question, isActive, isDragging, onClick, onDelete, index, attributes, listeners, setNodeRef, style }} />;
}

// --- MAIN QUIZ BUILDER ---
export default function QuizBuilder() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: course } = useCourse(courseId);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  
  // Form State
  const [quizDetails, setQuizDetails] = useState({
    title: '',
    description: '',
  });
  
  const [quizSettings, setQuizSettings] = useState({
    duration: 30,
    startTime: '',
    endTime: '',
  });

  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', type: 'multiple_choice', text: '', marks: 5, required: true, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: '0' }
  ]);
  const [activeId, setActiveId] = useState('q1');
  const activeQuestion = questions.find(q => q.id === activeId) || questions[0];
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const isDirty = !!quizDetails.title || questions.some(q => q.text);

  // Warn on browser refresh / tab close when there's unsaved work
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty && !confirm('Leave without saving? All changes will be lost.')) return;
    router.push(`/courses/${courseId}/quizzes`);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addQuestion = (type: QuestionType = 'multiple_choice') => {
    const newId = `q${Date.now()}`;
    setQuestions([...questions, { id: newId, type, text: '', marks: 5, required: true, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: '0' }]);
    setActiveId(newId);
  };

  const deleteQuestion = (id: string) => {
    if (questions.length === 1) {
      toast.error('You must have at least one question');
      return;
    }
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    if (activeId === id) {
      setActiveId(updated[0]?.id ?? null);
    }
    toast.success('Question deleted');
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  // Validation
  const getErrors = () => {
    const errors: string[] = [];
    if (!quizDetails.title.trim()) errors.push('Quiz title is required');
    if (!quizSettings.startTime) errors.push('Start time is required');
    if (!quizSettings.endTime) errors.push('End time is required');
    if (quizSettings.startTime && quizSettings.endTime && new Date(quizSettings.startTime) >= new Date(quizSettings.endTime)) {
      errors.push('End time must be after start time');
    }
    if (quizSettings.duration <= 0) errors.push('Duration must be greater than 0');
    if (totalMarks <= 0) errors.push('Total marks must be greater than 0 — add at least one question with marks');
    if (questions.some(q => !q.text.trim())) errors.push('All questions must have text');
    if (questions.some(q => q.type === 'multiple_choice' && q.options.filter(o => o.trim()).length < 2)) {
      errors.push('Multiple choice questions need at least 2 options');
    }
    return errors;
  };

  const handleSave = async () => {
    const errors = getErrors();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setSaving(true);
    try {
      // 1. Create Quiz
      const res = await quizApi.createQuiz(courseId, {
        ...quizDetails,
        ...quizSettings,
        totalMarks,
        startTime: new Date(quizSettings.startTime).toISOString(),
        endTime: new Date(quizSettings.endTime).toISOString(),
      });
      const newQuiz = res.data.data;
      
      // 2. Create Questions — bulk add
      const questionsPayload = questions.map((q, i) => {
        const payload: Record<string, unknown> = {
          text: q.text,
          type: q.type,
          marks: q.marks,
          order: i + 1,
          explanation: q.explanation,
        };
        if (q.type === 'multiple_choice') {
          const validOptions: string[] = [];
          
          let parsedCorrect = String(q.correctAnswer).trim();
          
          // Map 'A', 'B', 'C', 'D' directly to index '0', '1', '2', '3'
          const letterMatch = parsedCorrect.match(/^[A-Z]$/i);
          if (letterMatch) {
            parsedCorrect = String(parsedCorrect.toUpperCase().charCodeAt(0) - 65);
          } else if (isNaN(parseInt(parsedCorrect))) {
            // It might be the exact text of an option
            const idx = q.options.findIndex(opt => opt.trim().toLowerCase() === parsedCorrect.toLowerCase());
            if (idx !== -1) {
              parsedCorrect = String(idx);
            }
          }

          let newCorrect = parseInt(parsedCorrect);
          if (isNaN(newCorrect)) newCorrect = 0;

          for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
            if (q.options[optIdx].trim()) {
              validOptions.push(q.options[optIdx]);
            } else if (String(optIdx) === parsedCorrect) {
              newCorrect = 0; // Correct answer was empty, fallback to 0
            } else if (parseInt(parsedCorrect) > optIdx) {
              newCorrect -= 1; // Shift correct answer index down
            }
          }
          payload.options = validOptions.length ? validOptions : ['Option A', 'Option B'];
          payload.correctAnswer = String(Math.max(0, newCorrect));
        } else if (q.type === 'true_false') {
          payload.correctAnswer = String(q.correctAnswer).toLowerCase();
        } else if (q.type === 'short_answer') {
          payload.correctAnswer = q.correctAnswer || '';
        }
        return payload;
      });

      if (questionsPayload.length > 0) {
        await quizApi.bulkAddQuestions(newQuiz._id, questionsPayload);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.list(courseId) });
      toast.success('Quiz created successfully!');
      router.push(`/courses/${courseId}/quizzes/${newQuiz._id}`);
      
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-300 py-8">
           <div className="text-center space-y-3 mb-10">
             <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <FileText size={24} />
             </div>
             <h2 className="text-3xl font-display font-bold text-slate-900">Quiz Details</h2>
             <p className="text-sm text-slate-600">Give your quiz a title and add instructions for students.</p>
           </div>
           
           <div className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="space-y-2">
                 <label htmlFor="quiz-title" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Quiz Title *</label>
                 <input 
                   id="quiz-title"
                   autoFocus
                   className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm" 
                   placeholder="e.g., Midterm Exam - Chapter 5"
                   value={quizDetails.title}
                   onChange={e => setQuizDetails({...quizDetails, title: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <label htmlFor="quiz-description" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Instructions (Optional)</label>
                 <textarea 
                   id="quiz-description"
                   className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none h-32" 
                   placeholder="Add any instructions or context for students..."
                   value={quizDetails.description}
                   onChange={e => setQuizDetails({...quizDetails, description: e.target.value})}
                 />
              </div>
              <button 
                onClick={() => {
                  if (!quizDetails.title.trim()) {
                    toast.error('Quiz title is required');
                    return;
                  }
                  setStep(2);
                }}
                className="w-full btn btn-primary py-3 text-sm font-semibold gap-2 rounded-lg"
              >
                Continue to Settings <ArrowRight size={16} />
              </button>
           </div>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-300 py-8">
           <div className="text-center space-y-3 mb-10">
             <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-4">
                <Settings size={24} />
             </div>
             <h2 className="text-3xl font-display font-bold text-slate-900">Quiz Settings</h2>
             <p className="text-sm text-slate-600">Configure timing, duration, and total marks.</p>
           </div>
           
           <div className="space-y-6 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label htmlFor="quiz-duration" className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                      <Clock size={14}/> Duration (mins) *
                    </label>
                    <input 
                      id="quiz-duration"
                      type="number"
                      placeholder="e.g. 30"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm" 
                      value={quizSettings.duration}
                      onChange={e => setQuizSettings({...quizSettings, duration: parseInt(e.target.value) || 0})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label htmlFor="quiz-total-marks" className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                      <Target size={14}/> Total Marks
                    </label>
                    <div
                      id="quiz-total-marks"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-500"
                      title="Computed automatically from question marks"
                    >
                      {totalMarks} <span className="text-xs">(set per question)</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label htmlFor="quiz-start-time" className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                      <Clock size={14}/> Start Time *
                    </label>
                    <input 
                      id="quiz-start-time"
                      type="datetime-local"
                      title="Quiz start date and time"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm" 
                      value={quizSettings.startTime}
                      onChange={e => setQuizSettings({...quizSettings, startTime: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label htmlFor="quiz-end-time" className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                      <Clock size={14}/> End Time *
                    </label>
                    <input 
                      id="quiz-end-time"
                      type="datetime-local"
                      title="Quiz end date and time"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm" 
                      value={quizSettings.endTime}
                      onChange={e => setQuizSettings({...quizSettings, endTime: e.target.value})}
                    />
                 </div>
              </div>

              <div className="flex gap-3 pt-4">
                 <button 
                   onClick={() => setStep(1)}
                   className="flex-1 btn btn-secondary py-3 text-sm font-semibold rounded-lg"
                 >
                   Back
                 </button>
                 <button 
                   onClick={() => setStep(3)}
                   className="flex-[2] btn btn-primary py-3 text-sm font-semibold gap-2 rounded-lg"
                 >
                   Build Questions <ArrowRight size={16} />
                 </button>
              </div>
           </div>
        </div>
      );
    }
    return (
      <div className="flex h-full animate-in fade-in duration-300 w-full relative gap-0">
        {/* LEFT SIDEBAR: Question List */}
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
              <button 
                onClick={() => addQuestion('multiple_choice')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-xs uppercase tracking-wide hover:bg-primary-700 transition-colors"
              >
                 <Plus size={14} /> Add Question
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 scrollbar-premium">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={e => setDraggingId(String(e.active.id))}
                onDragEnd={e => { handleDragEnd(e); setDraggingId(null); }}
              >
                 <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {questions.map((q, idx) => (
                      <QuestionSidebarItem 
                        key={q.id} 
                        question={q} 
                        index={idx}
                        isActive={activeId === q.id} 
                        onClick={() => setActiveId(q.id)}
                        onDelete={() => deleteQuestion(q.id)}
                      />
                    ))}
                 </SortableContext>
                 <DragOverlay>
                   {draggingId ? (() => {
                     const dq = questions.find(q => q.id === draggingId);
                     const idx = questions.findIndex(q => q.id === draggingId);
                     return dq ? (
                       <QuestionSidebarItemContent
                         question={dq}
                         index={idx}
                         isActive={false}
                         isDragging={true}
                         onClick={() => {}}
                         onDelete={() => {}}
                         style={{ transform: 'none', transition: 'none' }}
                       />
                     ) : null;
                   })() : null}
                 </DragOverlay>
              </DndContext>
           </div>

           <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                 <span>Questions</span>
                 <span className="text-slate-900">{questions.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                 <span>Total Points</span>
                 <span className="text-primary-600">{totalMarks}</span>
              </div>
           </div>
        </aside>

        {/* CENTER: Question Editor */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 relative">
           <div className="max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                 {activeQuestion ? (
                   <motion.div
                     key={activeId}
                     initial={{ opacity: 0, y: 10 }} 
                     animate={{ opacity: 1, y: 0 }} 
                     exit={{ opacity: 0, y: -10 }}
                     className="space-y-8"
                   >
                      <div className="space-y-3">
                         <label htmlFor="question-text" className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Question Text *</label>
                         <textarea 
                           id="question-text"
                           className="w-full px-4 py-4 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-lg font-medium resize-none min-h-[100px]"
                           placeholder="Enter your question here..."
                           value={activeQuestion.text}
                           onChange={(e) => updateQuestion(activeId, { text: e.target.value })}
                         />
                      </div>

                      <div className="space-y-4">
                         <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Answer Options</label>
                         <QuestionCanvas q={activeQuestion} update={updateQuestion} />
                      </div>
                   </motion.div>
                 ) : (
                   <div className="h-64 flex items-center justify-center text-slate-400 font-medium">Select or add a question</div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* RIGHT SIDEBAR: Question Settings */}
        {activeQuestion && (
          <aside className="w-64 bg-white border-l border-slate-200 p-6 shadow-sm overflow-y-auto scrollbar-premium">
             <div className="flex items-center gap-2 mb-6">
                <Settings size={16} className="text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Settings</h3>
             </div>

             <div className="space-y-6">
                <section>
                   <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Type</label>
                   <div className="space-y-2">
                      {['multiple_choice', 'true_false', 'short_answer'].map((type) => (
                        <button 
                          key={type}
                          onClick={() => {
                            const updates: Partial<Question> = { type: type as QuestionType };
                            if (type === 'true_false') updates.correctAnswer = 'true';
                            if (type === 'multiple_choice') updates.correctAnswer = '0';
                            updateQuestion(activeId, updates);
                          }}
                          className={`w-full flex items-center gap-2 p-2.5 rounded-lg border transition-all text-xs font-semibold ${activeQuestion.type === type ? 'bg-primary-50 border-primary-300 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                           <div className="w-5 h-5 rounded flex items-center justify-center text-slate-400">
                              {getItemIcon(type as QuestionType)}
                           </div>
                           <span className="capitalize">{type.replace('_', ' ')}</span>
                        </button>
                      ))}
                   </div>
                </section>

                <section className="pt-4 border-t border-slate-200">
                   <label htmlFor="marks" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Marks</label>
                   <input 
                     id="marks" 
                     type="number" 
                     className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm font-semibold"
                     value={activeQuestion.marks}
                     onChange={(e) => updateQuestion(activeId, { marks: parseInt(e.target.value) || 0 })}
                   />
                </section>
             </div>
          </aside>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-6">
           <button 
             onClick={handleBack} 
             className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
           >
              ← Back
           </button>
           <div className="flex items-center gap-3">
              {[1, 2, 3].map(num => (
                <React.Fragment key={num}>
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      step >= num ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {num}
                  </div>
                  {num < 3 && <div className={`w-6 h-0.5 rounded-full ${step > num ? 'bg-primary-600' : 'bg-slate-200'}`} />}
                </React.Fragment>
              ))}
           </div>
           <span className="text-xs font-medium text-slate-600">
             {step === 1 && 'Quiz Details'}
             {step === 2 && 'Quiz Settings'}
             {step === 3 && 'Build Questions'}
           </span>
        </div>
        
        <div className="flex items-center gap-3">
           {step === 3 && (
             <>
               <button
                 onClick={() => setAiPanelOpen(true)}
                 className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 font-semibold text-xs hover:bg-violet-100 transition-colors"
               >
                 <Sparkles size={14} /> AI Generate
               </button>
               <button 
                 onClick={handleSave} 
                 disabled={saving}
                 className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-xs uppercase tracking-wide hover:bg-primary-700 disabled:opacity-50 transition-colors"
               >
                 {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} 
                 {saving ? 'Saving...' : 'Create Quiz'}
               </button>
             </>
           )}
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 flex overflow-hidden relative w-full">
         {renderStepContent()}

         {/* AI GENERATION PANEL */}
         <AnimatePresence>
            {aiPanelOpen && (
              <AIGeneratorPanel
                courseTitle={course?.title || ''}
                courseDescription={course?.description || ''}
                onClose={() => setAiPanelOpen(false)}
                onGenerated={(generated) => {
                  const newQuestions: Question[] = generated.map((q: Partial<Question> & { question?: string }, i: number) => ({
                    id: `ai-${Date.now()}-${i}`,
                    type: q.type === 'true_false' ? 'true_false' : q.type === 'short_answer' ? 'short_answer' : 'multiple_choice',
                    text: q.question || q.text || '',
                    marks: q.marks || 5,
                    required: true,
                    options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
                    correctAnswer: q.correctAnswer !== undefined ? String(q.correctAnswer) : '0',
                    explanation: q.explanation || '',
                  }));
                  setQuestions(prev => {
                    const updated = [...prev, ...newQuestions];
                    return updated;
                  });
                  if (newQuestions.length > 0) setActiveId(newQuestions[0].id);
                  toast.success(`${newQuestions.length} question${newQuestions.length !== 1 ? 's' : ''} added`);
                  setAiPanelOpen(false);
                }}
              />
            )}
         </AnimatePresence>
      </main>

    </div>
  );
}

// --- AI GENERATOR PANEL ---
function AIGeneratorPanel({ courseTitle, courseDescription, onClose, onGenerated }: {
  courseTitle: string;
  courseDescription: string;
  onClose: () => void;
  onGenerated: (questions: Partial<Question>[]) => void;
}) {
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      const topic = `${courseTitle}${courseDescription ? ': ' + courseDescription.slice(0, 200) : ''}`;
      const res = await aiApi.generateQuizQuestions(topic, difficulty, count);
      const data = res.data;
      const questions = Array.isArray(data.data) ? data.data : data.data?.questions || [];
      if (!questions.length) throw new Error('No questions returned');
      onGenerated(questions);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      setError(err?.response?.data?.message || err?.message || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
      >
        {/* Header */}
        <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-gradient-to-r from-violet-50 to-indigo-50 shrink-0">
          <div className="flex items-center gap-2 text-violet-700">
            <Brain size={18} />
            <span className="font-bold text-sm">AI Question Generator</span>
          </div>
          <button onClick={onClose} title="Close" aria-label="Close" className="text-slate-400 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            AI will generate quiz questions based on this course — added directly to your quiz.
          </p>

          {/* Course context pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Generating for</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{courseTitle || 'This course'}</p>
            {courseDescription && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{courseDescription}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="ai-difficulty" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Difficulty</label>
              <select
                id="ai-difficulty"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm bg-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="ai-count" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Questions</label>
              <input
                id="ai-count"
                type="number"
                min={1}
                max={20}
                placeholder="1–20"
                value={count}
                onChange={e => setCount(Math.min(20, Math.max(1, Number(e.target.value))))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-violet-800">What you&apos;ll get</p>
            <ul className="space-y-1 text-xs text-violet-700">
              <li>• Multiple choice questions with correct answers</li>
              <li>• Questions added directly to your quiz</li>
              <li>• You can edit or delete any generated question</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all disabled:opacity-50"
          >
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            {generating ? 'Generating...' : `Generate ${count} Question${count !== 1 ? 's' : ''}`}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function getItemIcon(type: QuestionType) {
  switch(type) {
    case 'multiple_choice': return <CheckSquare size={16} />;
    case 'true_false': return <HelpCircle size={16} />;
    case 'short_answer': return <Type size={16} />;
    default: return <HelpCircle size={16} />;
  }
}

function QuestionCanvas({ q, update }: { q: Question; update: (id: string, u: Partial<Question>) => void }) {
  switch(q.type) {
    case 'multiple_choice':
      return (
        <div className="space-y-3">
           {q.options?.map((opt, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="flex items-center gap-3 group"
              >
                 <button 
                   onClick={() => update(q.id, { correctAnswer: String(i) })}
                   className={`w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all border-2 flex-shrink-0 ${
                     q.correctAnswer === String(i) 
                      ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-600/30' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
                   }`}
                   title="Mark as correct answer"
                 >
                    {String.fromCharCode(65 + i)}
                 </button>
                 <input 
                   title={`Option ${String.fromCharCode(65 + i)}`}
                   placeholder="Enter option text..."
                   className={`flex-1 px-4 py-2.5 border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm ${
                     q.correctAnswer === String(i) ? 'border-primary-300 bg-primary-50' : 'border-slate-200 bg-white'
                   }`}
                   value={opt}
                   onChange={(e) => {
                     const next = [...(q.options || [])];
                     next[i] = e.target.value;
                     update(q.id, { options: next });
                   }}
                 />
                  <button 
                    onClick={() => {
                      const next = q.options.filter((_, idx) => idx !== i);
                      let newCorrect = q.correctAnswer;
                      if (q.correctAnswer === String(i)) {
                        // removed the correct option — pick the first remaining one
                        newCorrect = "0";
                      } else if (parseInt(q.correctAnswer) > i) {
                        // an option before the correct one was removed — shift index down
                        newCorrect = String(parseInt(q.correctAnswer) - 1);
                      }
                      update(q.id, { options: next, correctAnswer: newCorrect });
                    }}
                    disabled={q.options.length <= 2}
                    title="Remove option"
                    aria-label="Remove option"
                    className="p-2 rounded-lg bg-white text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 border border-slate-200 flex-shrink-0 disabled:pointer-events-none disabled:opacity-0"
                  >
                     <Trash2 size={16} />
                  </button>
              </motion.div>
           ))}
           <button 
             onClick={() => update(q.id, { options: [...(q.options || []), 'New Option'] })}
             className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-slate-600 font-semibold text-xs uppercase tracking-wide hover:bg-slate-50 hover:text-primary-600 transition-all border-2 border-dashed border-slate-200 mt-4"
           >
              <Plus size={14} /> Add Option
           </button>
        </div>
      );
    case 'true_false':
       return (
         <div className="flex gap-4">
            {['true', 'false'].map(val => (
              <button 
                key={val}
                onClick={() => update(q.id, { correctAnswer: val })}
                className={`flex-1 py-4 rounded-lg border-2 font-semibold text-sm uppercase tracking-wide transition-all ${
                  q.correctAnswer === val 
                    ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-600/30' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {val}
              </button>
            ))}
         </div>
       );
    case 'short_answer':
       return (
         <div className="h-32 w-full bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center px-6 text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2"><Type size={14}/> Student Response Area</span>
            <p className="text-xs text-slate-400 mt-1">Responses will require manual grading</p>
         </div>
       );
    default:
      return <div className="py-12 text-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 font-semibold uppercase tracking-wide text-xs">Unsupported Type</div>;
  }
}
