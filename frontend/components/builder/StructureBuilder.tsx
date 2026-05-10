'use client';

import React, { useState } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { 
  Plus, Layers, FileText, Video, HelpCircle, 
  Trash2, GripVertical, ChevronDown, ChevronRight,
  Sparkles, Clock, Globe, Shield, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- TYPES ---
interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'quiz' | 'assignment' | 'discussion';
  duration?: string;
}

interface Module {
  id: string;
  title: string;
  items: ContentItem[];
  isExpanded?: boolean;
}

// --- SORTABLE MODULE COMPONENT ---
function SortableModule({ module, onAddItem, onDeleteModule, onToggle, onUpdateModule }: { 
  module: Module, 
  onAddItem: (type: ContentItem['type']) => void,
  onDeleteModule: () => void,
  onToggle: () => void,
  onUpdateModule: (title: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`mb-6 group ${isDragging ? 'opacity-50' : ''}`}>
      <div className={`bg-white rounded-[32px] border-2 transition-all duration-500 overflow-hidden ${module.isExpanded ? 'border-blue-500 shadow-2xl shadow-blue-900/10' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}>
        
        {/* Module Header */}
        <div className="flex items-center gap-4 p-6 lg:p-8">
           <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-slate-300 hover:text-slate-600 transition-colors">
              <GripVertical size={20} />
           </div>
           
           <div className="flex-1 min-w-0">
              <input 
                className={`w-full bg-transparent border-none font-black text-xl lg:text-2xl tracking-tight outline-none focus:text-blue-600 transition-colors ${module.isExpanded ? 'text-blue-700' : 'text-slate-900'}`}
                value={module.title}
                onChange={(e) => onUpdateModule(e.target.value)}
                placeholder="Module Title..."
              />
              <div className="flex items-center gap-4 mt-1">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                   <Layers size={12} /> {module.items.length} Items
                 </span>
                 <span className="w-1 h-1 rounded-full bg-slate-200" />
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Draft</span>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <button onClick={onDeleteModule} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                <Trash2 size={18} />
              </button>
              <button onClick={onToggle} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${module.isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                <ChevronDown size={20} strokeWidth={3} />
              </button>
           </div>
        </div>

        {/* Module Content */}
        <AnimatePresence>
          {module.isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-8 pb-8 pt-2">
                 <div className="h-px bg-slate-100 mb-8" />
                 
                 <div className="space-y-3 mb-8">
                    {module.items.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group/item">
                         <div className="text-slate-300"><GripVertical size={16} /></div>
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getItemStyles(item.type)}`}>
                            {getItemIcon(item.type)}
                         </div>
                         <div className="flex-1">
                            <h5 className="font-bold text-slate-900 text-sm">{item.title}</h5>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.type}</span>
                         </div>
                         <button className="p-2 rounded-lg text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/item:opacity-100">
                            <Trash2 size={14} />
                         </button>
                      </div>
                    ))}
                    {module.items.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center">
                         <Sparkles size={32} className="text-slate-200 mb-4" />
                         <p className="text-slate-400 font-bold text-sm italic">"The canvas is empty. Start building your legacy."</p>
                      </div>
                    )}
                 </div>

                 {/* Add Item Actions */}
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <AddButton icon={<FileText size={16}/>} label="Lesson" onClick={() => onAddItem('lesson')} />
                    <AddButton icon={<HelpCircle size={16}/>} label="Quiz" onClick={() => onAddItem('quiz')} />
                    <AddButton icon={<MessageCircle size={16}/>} label="Discussion" onClick={() => onAddItem('discussion')} />
                    <AddButton icon={<Plus size={16}/>} label="Assignment" onClick={() => onAddItem('assignment')} />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AddButton({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95">
      {icon} {label}
    </button>
  );
}

function getItemIcon(type: ContentItem['type']) {
  switch(type) {
    case 'lesson': return <Video size={18} />;
    case 'quiz': return <HelpCircle size={18} />;
    case 'assignment': return <FileText size={18} />;
    case 'discussion': return <MessageCircle size={18} />;
  }
}

function getItemStyles(type: ContentItem['type']) {
  switch(type) {
    case 'lesson': return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'quiz': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'assignment': return 'bg-rose-50 text-rose-600 border border-rose-100';
    case 'discussion': return 'bg-amber-50 text-amber-600 border border-amber-100';
  }
}

// --- MAIN BUILDER COMPONENT ---
export default function StructureBuilder() {
  const [modules, setModules] = useState<Module[]>([
    { id: 'm1', title: 'Getting Started: Fundamentals', isExpanded: true, items: [
      { id: 'i1', title: 'Course Welcome & Vision', type: 'lesson' },
      { id: 'i2', title: 'Knowledge Assessment', type: 'quiz' },
    ] }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addModule = () => {
    const newId = `m${Date.now()}`;
    setModules([...modules, { id: newId, title: 'Untitled Module', items: [], isExpanded: true }]);
  };

  const addItem = (moduleId: string, type: ContentItem['type']) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, items: [...m.items, { id: `i${Date.now()}`, title: `New ${type}`, type }] };
      }
      return m;
    }));
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight">The Architect.</h2>
           <p className="text-slate-500 font-medium">Design the backbone of your curriculum with drag-and-drop precision.</p>
        </div>
        <button 
          onClick={addModule}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={18} /> New Module
        </button>
      </header>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {modules.map((module) => (
              <SortableModule 
                key={module.id} 
                module={module} 
                onToggle={() => setModules(modules.map(m => m.id === module.id ? { ...m, isExpanded: !m.isExpanded } : m))}
                onAddItem={(type) => addItem(module.id, type)}
                onDeleteModule={() => setModules(modules.filter(m => m.id !== module.id))}
                onUpdateModule={(title) => setModules(modules.map(m => m.id === module.id ? { ...m, title } : m))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modules.length === 0 && (
         <div className="py-32 text-center bg-white rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-[32px] bg-blue-50 text-blue-200 flex items-center justify-center mb-6">
               <Plus size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Build Your Structure</h3>
            <p className="text-slate-500 font-medium mb-10">Modules represent weeks or topics in your syllabus.</p>
            <button onClick={addModule} className="px-10 py-5 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20">
               Initialize First Module
            </button>
         </div>
      )}
    </div>
  );
}
