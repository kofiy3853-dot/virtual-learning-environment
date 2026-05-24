'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { 
  Plus, GripVertical, Trash2, Settings, Target,
  Save, HelpCircle, CheckSquare,
  Type, Sparkles, Loader2,
  FileText, Clock, ArrowRight, Brain, Zap, X
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent 
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
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

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
}

// --- SORTABLE QUESTION ITEM ---
function QuestionSidebarItem({ question, isActive, onClick, index }: { question: Question, isActive: boolean, onClick: () => void, index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer mb-3 ${
        isActive 
          ? 'bg-primary-600 border-primary-400 text-white shadow-xl shadow-primary-600/20' 
          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 shadow-sm'
      }`}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-50"><GripVertical size={16}/></div>
      <div className="flex-1 min-w-0">
         <h5 className="font-bold text-xs truncate leading-none mb-1">{question.text || `Question ${index + 1}`}</h5>
         <span className={`text-[8px] font-black uppercase tracking-widest opacity-60`}>{question.type.replace('_', ' ')}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
         <Trash2 size={14} className={isActive ? 'text-white/70' : 'text-slate-300'} />
      </div>
    </div>
  );
}

// --- MAIN QUIZ BUILDER ---
export default function QuizBuilder() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [previewMode, setPreviewMode] = useState(false);
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
    totalMarks: 20
  });

  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', type: 'multiple_choice', text: 'What is the primary law of thermodynamics?', marks: 10, required: true, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: '0' }
  ]);
  const [activeId, setActiveId] = useState('q1');
  const activeQuestion = questions.find(q => q.id === activeId) || questions[0];

  const sensors = useSensors(useSensor(PointerSensor));

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

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleSave = async () => {
    if (!quizDetails.title) return toast.error("Title is required.");
    if (!quizSettings.startTime || !quizSettings.endTime) return toast.error("Start and End times are required.");

    setSaving(true);
    try {
      // 1. Create Quiz — convert datetime-local to ISO strings
      const res = await quizApi.createQuiz(courseId, {
        ...quizDetails,
        ...quizSettings,
        startTime: quizSettings.startTime ? new Date(quizSettings.startTime).toISOString() : '',
        endTime: quizSettings.endTime ? new Date(quizSettings.endTime).toISOString() : '',
      });
      const newQuiz = res.data.data;
      
      // 2. Create Questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const payload: Record<string, unknown> = {
          text: q.text || `Question ${i + 1}`,
          type: q.type,
          marks: q.marks,
          order: i + 1,
        };
        if (q.type === 'multiple_choice') {
          payload.options = q.options.filter(o => o.trim());
          payload.correctAnswer = q.correctAnswer;
        } else if (q.type === 'true_false') {
          payload.correctAnswer = q.correctAnswer;
        } else {
          // short_answer
          payload.options = [];
        }
        await quizApi.addQuestion(newQuiz._id, payload);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.quizzes.list(courseId) });
      toast.success('Assessment successfully configured.');
      router.push(`/courses/${courseId}/quizzes/${newQuiz._id}`);
      
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Configuration failed.');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 py-12">
           <div className="text-center space-y-4 mb-12">
             <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center mx-auto border border-primary-100 shadow-inner mb-6">
                <FileText size={28} />
             </div>
             <h2 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight">Quiz Details</h2>
             <p className="text-slate-500 font-medium">Define the core identity of this assessment.</p>
           </div>
           
           <div className="space-y-8 bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Assessment Title</label>
                 <input 
                   autoFocus
                   className="input-premium h-16 text-lg" 
                   placeholder="e.g. Advanced Midterm Protocol"
                   value={quizDetails.title}
                   onChange={e => setQuizDetails({...quizDetails, title: e.target.value})}
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Description / Instructions</label>
                 <textarea 
                   className="input-premium py-6 resize-none h-40 text-lg" 
                   placeholder="Provide context or instructions for students..."
                   value={quizDetails.description}
                   onChange={e => setQuizDetails({...quizDetails, description: e.target.value})}
                 />
              </div>
              <button 
                onClick={() => setStep(2)}
                className="btn btn-primary w-full h-16 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 gap-2"
              >
                Proceed to Settings <ArrowRight size={16} />
              </button>
           </div>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 py-12">
           <div className="text-center space-y-4 mb-12">
             <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center mx-auto border border-primary-100 shadow-inner mb-6">
                <Settings size={28} />
             </div>
             <h2 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight">Quiz Settings</h2>
             <p className="text-slate-500 font-medium">Establish constraints and scheduling.</p>
           </div>
           
           <div className="space-y-8 bg-white p-10 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                      <Clock size={14}/> Duration (Mins)
                    </label>
                    <input 
                      type="number"
                      className="input-premium h-16 text-lg" 
                      value={quizSettings.duration}
                      onChange={e => setQuizSettings({...quizSettings, duration: parseInt(e.target.value) || 0})}
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                      <Target size={14}/> Total Marks
                    </label>
                    <input 
                      type="number"
                      className="input-premium h-16 text-lg" 
                      value={quizSettings.totalMarks}
                      onChange={e => setQuizSettings({...quizSettings, totalMarks: parseInt(e.target.value) || 0})}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                      <Clock size={14}/> Start Time
                    </label>
                    <input 
                      type="datetime-local"
                      className="input-premium h-16 text-sm" 
                      value={quizSettings.startTime}
                      onChange={e => setQuizSettings({...quizSettings, startTime: e.target.value})}
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                      <Clock size={14}/> End Time
                    </label>
                    <input 
                      type="datetime-local"
                      className="input-premium h-16 text-sm" 
                      value={quizSettings.endTime}
                      onChange={e => setQuizSettings({...quizSettings, endTime: e.target.value})}
                    />
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button 
                   onClick={() => setStep(1)}
                   className="btn btn-secondary flex-1 h-16 text-xs font-black uppercase tracking-widest gap-2"
                 >
                   Back
                 </button>
                 <button 
                   onClick={() => setStep(3)}
                   className="btn btn-primary flex-[2] h-16 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 gap-2"
                 >
                   Build Questions <ArrowRight size={16} />
                 </button>
              </div>
           </div>
        </div>
      );
    }
    return (
      <div className="flex h-full animate-in fade-in duration-500 w-full relative">
        {/* LEFT PANEL: Blueprint */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
           <div className="p-6 border-b border-slate-100 space-y-4">
              <button 
                onClick={() => setAiPanelOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
              >
                 <Sparkles size={16} /> AI Generator
              </button>
              <button 
                onClick={() => addQuestion('multiple_choice')}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary-50 text-primary-600 font-black text-xs uppercase tracking-widest hover:bg-primary-100 transition-all active:scale-95 border-2 border-primary-100"
              >
                 <Plus size={16} /> Add Question
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                 <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {questions.map((q, idx) => (
                      <QuestionSidebarItem 
                        key={q.id} 
                        question={q} 
                        index={idx}
                        isActive={activeId === q.id} 
                        onClick={() => setActiveId(q.id)} 
                      />
                    ))}
                 </SortableContext>
              </DndContext>
           </div>

           <div className="p-6 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <span>Total Questions</span>
                 <span className="text-slate-900">{questions.length}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                 <span>Total Points</span>
                 <span className="text-primary-600">{questions.reduce((acc, q) => acc + q.marks, 0)}</span>
              </div>
           </div>
        </aside>

        {/* CENTER: The Canvas */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-slate-50 relative">
           <div className="max-w-3xl mx-auto">
              <AnimatePresence mode="wait">
                 {activeQuestion ? (
                   <motion.div
                     key={activeId}
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                     className="space-y-12"
                   >
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em]">Question Statement</label>
                         <textarea 
                           className="w-full bg-transparent border-none text-3xl lg:text-4xl font-black text-slate-900 placeholder:text-slate-300 outline-none resize-none tracking-tight leading-tight min-h-[120px]"
                           placeholder="Type your question here..."
                           value={activeQuestion.text}
                           onChange={(e) => updateQuestion(activeId, { text: e.target.value })}
                         />
                      </div>

                      <div className="space-y-8">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Interactive Canvas</label>
                         {renderQuestionCanvas(activeQuestion, updateQuestion)}
                      </div>
                   </motion.div>
                 ) : (
                   <div className="h-64 flex items-center justify-center text-slate-400 font-bold">Select or add a question</div>
                 )}
              </AnimatePresence>
           </div>
        </div>

        {/* RIGHT PANEL: Settings Hub */}
        {activeQuestion && (
          <aside className="w-80 bg-white border-l border-slate-200 p-8 shadow-inner overflow-y-auto z-10">
             <div className="flex items-center gap-3 mb-10">
                <Settings size={18} className="text-slate-400" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Logic Hub</h3>
             </div>

             <div className="space-y-10">
                <section>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Question Type</label>
                   <div className="grid grid-cols-1 gap-2">
                      {['multiple_choice', 'true_false', 'short_answer'].map((type) => (
                        <button 
                          key={type}
                          onClick={() => updateQuestion(activeId, { type: type as QuestionType })}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-xs font-bold ${activeQuestion.type === type ? 'bg-white border-primary-600 text-primary-600 shadow-lg shadow-primary-600/5' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                        >
                           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                              {getItemIcon(type as QuestionType)}
                           </div>
                           <span className="capitalize">{type.replace('_', ' ')}</span>
                        </button>
                      ))}
                   </div>
                </section>

                <section className="space-y-6 pt-10 border-t border-slate-200">
                   <div>
                      <label htmlFor="points" className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Yield Weight (Marks)</label>
                      <input 
                        id="points" type="number" placeholder="e.g. 5"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 font-black focus:border-primary-600 outline-none transition-all"
                        value={activeQuestion.marks}
                        onChange={(e) => updateQuestion(activeId, { marks: parseInt(e.target.value) || 0 })}
                      />
                   </div>
                </section>
             </div>
          </aside>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-8">
           <button onClick={() => router.push(`/courses/${courseId}/quizzes`)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-500 transition-colors">
              Close
           </button>
           <div className="flex items-center gap-2">
              {[1, 2, 3].map(num => (
                <React.Fragment key={num}>
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step >= num ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {num}
                  </div>
                  {num < 3 && <div className={`w-8 h-0.5 rounded-full ${step > num ? 'bg-primary-500' : 'bg-slate-100'}`} />}
                </React.Fragment>
              ))}
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           {step === 3 && (
             <button onClick={handleSave} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary-600 text-white font-black text-xs uppercase tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-600/20 transition-all active:scale-95">
                {saving ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16} /> Finalize Assessment</>}
             </button>
           )}
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 flex overflow-hidden relative w-full">
         {renderStepContent()}

         {/* AI GENERATION PANEL (Slide-over) */}
         <AnimatePresence>
            {aiPanelOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                  onClick={() => setAiPanelOpen(false)}
                />
                <motion.div 
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-100"
                >
                   <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0">
                      <div className="flex items-center gap-3 text-indigo-600">
                         <Brain size={20} />
                         <span className="font-black text-sm uppercase tracking-widest">AI Architect</span>
                      </div>
                      <button onClick={() => setAiPanelOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                        <X size={20} />
                      </button>
                   </div>
                   <div className="p-8 space-y-8 overflow-y-auto flex-1">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Knowledge Topic</label>
                         <textarea className="input-premium py-4 text-sm resize-none" placeholder="E.g., Quantum Mechanics, Cell Biology..." />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Difficulty</label>
                         <select className="input-premium h-14 text-sm bg-white">
                            <option>Introductory</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quantity</label>
                         <input type="number" className="input-premium h-14 text-sm" defaultValue={5} />
                      </div>
                   </div>
                   <div className="p-8 border-t border-slate-100 bg-slate-50 shrink-0">
                      <button 
                        onClick={() => {
                          toast.success('AI generation initiated (mocked).');
                          setAiPanelOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-xl shadow-indigo-600/20 transition-all"
                      >
                         <Zap size={16} /> Synthesize Questions
                      </button>
                   </div>
                </motion.div>
              </>
            )}
         </AnimatePresence>
      </main>

    </div>
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

function renderQuestionCanvas(q: Question, update: (id: string, u: Partial<Question>) => void) {
  switch(q.type) {
    case 'multiple_choice':
      return (
        <div className="space-y-4">
           {q.options?.map((opt, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="flex items-center gap-4 group"
              >
                 <button 
                   onClick={() => update(q.id, { correctAnswer: String(i) })}
                   className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all border-2 ${
                     q.correctAnswer === String(i) 
                      ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' 
                      : 'bg-white border-slate-200 text-slate-400 hover:border-primary-200 hover:text-primary-500'
                   }`}
                   title="Mark as correct answer"
                 >
                    {String.fromCharCode(65 + i)}
                 </button>
                 <input 
                   title={`Option ${String.fromCharCode(65 + i)}`}
                   placeholder="Enter answer option..."
                   className={`flex-1 bg-white border-2 rounded-2xl px-6 h-16 text-slate-900 font-bold focus:border-primary-500 transition-all outline-none shadow-sm ${
                     q.correctAnswer === String(i) ? 'border-primary-200 bg-primary-50/10' : 'border-slate-100'
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
                      if (q.correctAnswer === String(i)) newCorrect = "0";
                      else if (parseInt(q.correctAnswer) > i) newCorrect = String(parseInt(q.correctAnswer) - 1);
                      update(q.id, { options: next, correctAnswer: newCorrect });
                    }}
                    className="p-4 rounded-2xl bg-white text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 border border-slate-100 shadow-sm"
                  >
                     <Trash2 size={18} />
                  </button>
              </motion.div>
           ))}
           <button 
             onClick={() => update(q.id, { options: [...(q.options || []), 'New Option'] })}
             className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all border-2 border-dashed border-slate-200 mt-6 shadow-sm"
           >
              <Plus size={14} /> Add Option
           </button>
        </div>
      );
    case 'true_false':
       return (
         <div className="flex gap-6">
            {['true', 'false'].map(val => (
              <button 
                key={val}
                onClick={() => update(q.id, { correctAnswer: val })}
                className={`flex-1 h-24 rounded-[24px] border-2 font-black text-lg uppercase tracking-widest transition-all shadow-sm ${
                  q.correctAnswer === val 
                    ? 'bg-primary-500 border-primary-500 text-white shadow-xl shadow-primary-500/20' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {val}
              </button>
            ))}
         </div>
       );
    case 'short_answer':
       return (
         <div className="h-40 w-full bg-white border-2 border-slate-100 rounded-[24px] flex flex-col justify-center px-8 text-slate-400 shadow-sm">
            <span className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-3"><Type size={16}/> Student Response Area</span>
         </div>
       );
    default:
      return <div className="py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs">Unsupported Type</div>;
  }
}
