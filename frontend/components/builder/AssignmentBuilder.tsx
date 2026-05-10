'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { 
  Bold, Italic, List, ListOrdered, Code, 
  Image as ImageIcon, Link as LinkIcon, Sparkles, 
  FileText, Calendar, Target, Globe, Shield, 
  Plus, Trash2, ArrowRight, Save, Loader2,
  Heading1, Heading2, Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- EDITOR TOOLBAR ---
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBold().run()} 
        isActive={editor.isActive('bold')} 
        icon={<Bold size={16} />} 
      />
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleItalic().run()} 
        isActive={editor.isActive('italic')} 
        icon={<Italic size={16} />} 
      />
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
        isActive={editor.isActive('heading', { level: 1 })} 
        icon={<Heading1 size={16} />} 
      />
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
        isActive={editor.isActive('heading', { level: 2 })} 
        icon={<Heading2 size={16} />} 
      />
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBulletList().run()} 
        isActive={editor.isActive('bulletList')} 
        icon={<List size={16} />} 
      />
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
        isActive={editor.isActive('orderedList')} 
        icon={<ListOrdered size={16} />} 
      />
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
        isActive={editor.isActive('codeBlock')} 
        icon={<Code size={16} />} 
      />
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
        isActive={editor.isActive('blockquote')} 
        icon={<Quote size={16} />} 
      />
    </div>
  );
};

const ToolbarButton = ({ onClick, isActive, icon }: { onClick: () => void, isActive: boolean, icon: any }) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
  >
    {icon}
  </button>
);

// --- MAIN BUILDER ---
export default function AssignmentBuilder() {
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: '<p>Define your assignment instructions here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-8 font-medium text-slate-700',
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="flex-1">
             <div className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <Sparkles size={14} />
                Strategic Assignment Builder
             </div>
             <input 
               className="w-full bg-transparent border-none text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter outline-none placeholder:text-slate-200"
               placeholder="Assignment Title..."
               value={title}
               onChange={(e) => setTitle(e.target.value)}
             />
          </div>
          <div className="flex gap-4">
             <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                <Save size={16} /> Save Progress
             </button>
             <button onClick={() => setIsSaving(true)} className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-600/20 transition-all active:scale-95">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Target size={16} /> Publish Project</>}
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* Primary Editor Workspace */}
           <div className="lg:col-span-8">
              <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden">
                 <MenuBar editor={editor} />
                 <EditorContent editor={editor} />
              </div>
              
              {/* Submission Protocols */}
              <div className="mt-12 bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                       <Shield size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Submission Protocols</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ProtocolToggle label="File Upload (PDF, ZIP, DOCX)" defaultChecked={true} />
                    <ProtocolToggle label="Text Entry Workspace" defaultChecked={false} />
                    <ProtocolToggle label="Cloud URL (Google Drive, GitHub)" defaultChecked={true} />
                    <ProtocolToggle label="Video Submission" defaultChecked={false} />
                 </div>
              </div>
           </div>

           {/* Strategic Sidebar */}
           <div className="lg:col-span-4 space-y-8">
              {/* Metadata Card */}
              <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm space-y-8">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Maximum Points</label>
                    <div className="relative">
                       <input 
                         type="number" 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 h-16 text-slate-900 font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
                         value={points}
                         onChange={(e) => setPoints(parseInt(e.target.value))}
                       />
                       <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">PTS</div>
                    </div>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Strategic Deadline</label>
                    <div className="relative">
                       <input 
                         type="datetime-local" 
                         className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 h-16 text-slate-900 font-black focus:bg-white focus:border-blue-600 transition-all outline-none"
                         value={dueDate}
                         onChange={(e) => setDueDate(e.target.value)}
                       />
                       <Calendar size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    </div>
                 </div>
              </div>

              {/* Rubric Scaffolding */}
              <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                 <div className="flex items-center gap-3 mb-6">
                    <Target size={20} className="text-blue-100" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Rubric Architect</h3>
                 </div>
                 <p className="text-sm font-bold opacity-80 mb-8 leading-relaxed italic">
                    "Define intelligent grading criteria to ensure transparent and objective evaluation."
                 </p>
                 <button className="w-full py-4 rounded-2xl bg-white text-blue-600 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg active:scale-95">
                    Generate AI Rubric
                 </button>
              </div>

              {/* Tips Section */}
              <div className="p-6 rounded-[24px] bg-slate-50 border border-slate-100 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                    <Globe size={20} />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Global Standard</h4>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                       This project uses industry-standard TipTap blocks. Students will see high-fidelity typography and interactive code blocks.
                    </p>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}

function ProtocolToggle({ label, defaultChecked }: { label: string, defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-blue-100 transition-all group">
       <span className="text-xs font-black text-slate-900 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{label}</span>
       <button 
         onClick={() => setChecked(!checked)}
         className={`w-12 h-6 rounded-full transition-all relative ${checked ? 'bg-blue-600 shadow-inner' : 'bg-slate-200'}`}
       >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`} />
       </button>
    </div>
  );
}
