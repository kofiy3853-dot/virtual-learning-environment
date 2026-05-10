'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, GripVertical, Trash2, Copy, Settings, Eye, 
  ChevronRight, Save, HelpCircle, CheckSquare, 
  Type, FileText, Code, Upload, AlignLeft, 
  Clock, Shield, Target, Sparkles, Loader2,
  Layout, Smartphone, Monitor
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

// --- TYPES ---
type QuestionType = 'mcq' | 'checkbox' | 'true_false' | 'short' | 'essay' | 'code' | 'upload';

interface Question {
  id: string;
  type: QuestionType;
  title: string;
  points: number;
  required: boolean;
  options?: string[];
  correctAnswer?: any;
}

// --- SORTABLE QUESTION ITEM ---
function QuestionSidebarItem({ question, isActive, onClick }: { question: Question, isActive: boolean, onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`group flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer mb-3 ${
        isActive 
          ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20' 
          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 shadow-sm'
      }`}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing opacity-50"><GripVertical size={16}/></div>
      <div className="flex-1 min-w-0">
         <h5 className="font-bold text-xs truncate leading-none mb-1">{question.title || 'Untitled Question'}</h5>
         <span className={`text-[8px] font-black uppercase tracking-widest opacity-60`}>{question.type}</span>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
         <Trash2 size={14} className={isActive ? 'text-white/70' : 'text-slate-300'} />
      </div>
    </div>
  );
}

// --- MAIN QUIZ BUILDER ---
export default function QuizBuilder() {
  const [questions, setQuestions] = useState<Question[]>([
    { id: 'q1', type: 'mcq', title: 'What is the primary law of thermodynamics?', points: 10, required: true, options: ['Option 1', 'Option 2'] }
  ]);
  const [activeId, setActiveId] = useState('q1');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));
  const activeQuestion = questions.find(q => q.id === activeId) || questions[0];

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

  const addQuestion = (type: QuestionType) => {
    const newId = `q${Date.now()}`;
    setQuestions([...questions, { id: newId, type, title: '', points: 5, required: true, options: ['Option 1'] }]);
    setActiveId(newId);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans">
      
      {/* LEFT PANEL: Blueprint */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
         <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Sparkles size={20} />
               </div>
               <h2 className="text-lg font-black text-slate-900 tracking-tight">The Blueprint.</h2>
            </div>
            <button 
              onClick={() => addQuestion('mcq')}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-50 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-100 transition-all active:scale-95 border-2 border-blue-100"
            >
               <Plus size={16} /> Add Question
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
               <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  {questions.map(q => (
                    <QuestionSidebarItem 
                      key={q.id} 
                      question={q} 
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
               <span className="text-blue-600">{questions.reduce((acc, q) => acc + q.points, 0)}</span>
            </div>
         </div>
      </aside>

      {/* CENTER: The Canvas */}
      <main className="flex-1 flex flex-col relative">
         <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
               <h1 className="text-xl font-black text-slate-900 tracking-tight">New Assessment <span className="text-blue-600 text-sm italic opacity-50 ml-2">Genesis Build</span></h1>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mr-4">
                  <button onClick={() => setPreviewMode(false)} className={`p-2 rounded-lg transition-all ${!previewMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><Monitor size={16}/></button>
                  <button onClick={() => setPreviewMode(true)} className={`p-2 rounded-lg transition-all ${previewMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><Smartphone size={16}/></button>
               </div>
               <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                  <Eye size={16} /> Preview
               </button>
               <button onClick={() => setSaving(true)} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                  {saving ? <Loader2 size={16} className="animate-spin"/> : <><Save size={16} /> Save Changes</>}
               </button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-12 lg:p-20 bg-white">
            <div className="max-w-3xl mx-auto">
               <AnimatePresence mode="wait">
                  <motion.div
                    key={activeId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-12"
                  >
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Question Statement</label>
                        <textarea 
                          autoFocus
                          className="w-full bg-transparent border-none text-3xl lg:text-4xl font-black text-slate-900 placeholder:text-slate-100 outline-none resize-none tracking-tight leading-tight"
                          placeholder="Type your question here..."
                          value={activeQuestion.title}
                          onChange={(e) => updateQuestion(activeId, { title: e.target.value })}
                        />
                     </div>

                     <div className="space-y-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Interactive Canvas</label>
                        {renderQuestionCanvas(activeQuestion, updateQuestion)}
                     </div>
                  </motion.div>
               </AnimatePresence>
            </div>
         </div>
      </main>

      {/* RIGHT PANEL: Settings Hub */}
      <aside className="w-80 bg-[#F8FAFC] border-l border-slate-200 p-8 shadow-inner overflow-y-auto">
         <div className="flex items-center gap-3 mb-10">
            <Settings size={18} className="text-slate-400" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Logic Hub</h3>
         </div>

         <div className="space-y-10">
            <section>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Question Type</label>
               <div className="grid grid-cols-1 gap-2">
                  {['mcq', 'checkbox', 'short', 'essay', 'code', 'upload'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => updateQuestion(activeId, { type: type as QuestionType })}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-xs font-bold ${activeQuestion.type === type ? 'bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-600/5' : 'bg-white/50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                       <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          {getItemIcon(type as QuestionType)}
                       </div>
                       <span className="capitalize">{type.replace('_', ' ')}</span>
                    </button>
                  ))}
               </div>
            </section>

            <section className="space-y-6 pt-10 border-t border-slate-200">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Point Allocation</label>
                  <input 
                    type="number" 
                    className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 h-12 text-slate-900 font-black focus:border-blue-600 outline-none transition-all"
                    value={activeQuestion.points}
                    onChange={(e) => updateQuestion(activeId, { points: parseInt(e.target.value) })}
                  />
               </div>
               <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Required</span>
                  <button 
                    onClick={() => updateQuestion(activeId, { required: !activeQuestion.required })}
                    className={`w-12 h-6 rounded-full transition-all relative ${activeQuestion.required ? 'bg-blue-600 shadow-inner' : 'bg-slate-200'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${activeQuestion.required ? 'left-7' : 'left-1'}`} />
                  </button>
               </div>
            </section>
         </div>
      </aside>
    </div>
  );
}

function getItemIcon(type: QuestionType) {
  switch(type) {
    case 'mcq': return <CheckSquare size={16} />;
    case 'checkbox': return <Layers size={16} />;
    case 'short': return <Type size={16} />;
    case 'essay': return <AlignLeft size={16} />;
    case 'code': return <Code size={16} />;
    case 'upload': return <Upload size={16} />;
    default: return <HelpCircle size={16} />;
  }
}

function renderQuestionCanvas(q: Question, update: (id: string, u: Partial<Question>) => void) {
  switch(q.type) {
    case 'mcq':
    case 'checkbox':
      return (
        <div className="space-y-4">
           {q.options?.map((opt, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="flex items-center gap-4 group"
              >
                 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-black text-xs text-slate-300">
                    {String.fromCharCode(65 + i)}
                 </div>
                 <input 
                   className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 h-16 text-slate-900 font-bold focus:bg-white focus:border-blue-600 transition-all outline-none"
                   value={opt}
                   onChange={(e) => {
                     const next = [...(q.options || [])];
                     next[i] = e.target.value;
                     update(q.id, { options: next });
                   }}
                 />
                 <button className="p-3 rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                 </button>
              </motion.div>
           ))}
           <button 
             onClick={() => update(q.id, { options: [...(q.options || []), 'New Option'] })}
             className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border-2 border-dashed border-slate-200 hover:border-blue-200 mt-4"
           >
              <Plus size={14} /> Add Option
           </button>
        </div>
      );
    case 'essay':
       return (
         <div className="h-64 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-300 gap-4">
            <AlignLeft size={48} className="opacity-20" />
            <span className="text-xs font-black uppercase tracking-widest opacity-50">Free Response Workspace</span>
         </div>
       );
    case 'code':
       return (
         <div className="h-64 w-full bg-slate-900 rounded-[32px] p-8 flex flex-col gap-4 overflow-hidden border-2 border-slate-800">
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-rose-500" />
               <div className="w-3 h-3 rounded-full bg-amber-500" />
               <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="space-y-3 opacity-20">
               <div className="h-2 w-1/3 bg-white rounded-full" />
               <div className="h-2 w-1/2 bg-white rounded-full" />
               <div className="h-2 w-1/4 bg-white rounded-full" />
            </div>
            <div className="mt-auto flex justify-center">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Intelligent Code Runner Active</span>
            </div>
         </div>
       );
    default:
      return <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase tracking-widest text-xs">Canvas for {q.type} incoming</div>;
  }
}
