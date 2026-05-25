'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TiptapLink from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold, Italic, List, ListOrdered, Code,
  Sparkles, Calendar, Target, Globe, Shield,
  Save, Loader2, Heading1, Heading2, Quote,
  ArrowLeft, ChevronUp, Plus, X,
  CheckCircle2, AlertCircle, FileText, Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { courseApi } from '@/utils/api/courseApi';
import toast from 'react-hot-toast';

// ─── TOOLBAR ─────────────────────────────────────────────────────────────────
const ToolbarButton = ({
  onClick, isActive, icon, title,
}: { onClick: () => void; isActive: boolean; icon: React.ReactNode; title: string }) => (
  <button
    type="button" onClick={onClick} title={title} aria-label={title}
    className={`p-2 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
  >
    {icon}
  </button>
);

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 p-3 border-b border-slate-100 bg-slate-50/60">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={<Bold size={15} />} title="Bold" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={<Italic size={15} />} title="Italic" />
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={<Heading1 size={15} />} title="Heading 1" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={<Heading2 size={15} />} title="Heading 2" />
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={<List size={15} />} title="Bullet List" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={<ListOrdered size={15} />} title="Ordered List" />
      <div className="w-px h-5 bg-slate-200 mx-1" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={<Code size={15} />} title="Code Block" />
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={<Quote size={15} />} title="Blockquote" />
    </div>
  );
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface RubricCriterion {
  id: string;
  label: string;
  points: number;
  description: string;
}

const DRAFT_KEY = 'assignmentBuilder_draft';

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AssignmentBuilder({ courseId }: { courseId: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [points, setPoints] = useState<number>(100);
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState('');
  const [rubric, setRubric] = useState<RubricCriterion[]>([]);
  const [showRubric, setShowRubric] = useState(false);
  const [touched, setTouched] = useState({ title: false, dueDate: false, points: false });

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapLink.configure({ openOnClick: false }),
      Image,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[360px] p-8 text-slate-700',
      },
    },
  });

  const editorText = editor?.getText() ?? '';
  const wordCount = editorText.trim() ? editorText.trim().split(/\s+/).length : 0;
  const charCount = editorText.length;

  // Restore draft
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.title) setTitle(d.title);
      if (d.points) setPoints(d.points);
      if (d.dueDate) setDueDate(d.dueDate);
      if (d.rubric) setRubric(d.rubric);
      setAutoSaveLabel('Draft restored');
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set editor content after restore (editor may not be ready on first render)
  useEffect(() => {
    if (!editor) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.content) editor.commands.setContent(d.content);
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Auto-save every 30s
  useEffect(() => {
    const id = setInterval(() => {
      if (!title && !dueDate) return;
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title, points, dueDate, rubric,
          content: editor?.getHTML() ?? '',
        }));
        const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setAutoSaveLabel(`Auto-saved at ${t}`);
      } catch { /* ignore */ }
    }, 30000);
    return () => clearInterval(id);
  }, [title, points, dueDate, rubric, editor]);

  // Scroll detection
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 300);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const addCriterion = () => setRubric(r => [...r, {
    id: `rc-${Date.now()}`, label: '', points: 10, description: ''
  }]);
  const updateCriterion = (id: string, patch: Partial<RubricCriterion>) =>
    setRubric(r => r.map(c => c.id === id ? { ...c, ...patch } : c));
  const removeCriterion = (id: string) => setRubric(r => r.filter(c => c.id !== id));
  const rubricTotal = rubric.reduce((s, c) => s + (c.points || 0), 0);

  const saveDraft = async () => {
    if (!title) { toast.error('Add a title before saving.'); return; }
    setIsDraftSaving(true);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        title, points, dueDate, rubric,
        content: editor?.getHTML() ?? '',
      }));
      setAutoSaveLabel('Draft saved');
      toast.success('Draft saved locally.');
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handlePublish = async () => {
    setTouched({ title: true, dueDate: true, points: true });
    if (!title.trim()) { toast.error('Assignment title is required.'); return; }
    if (!dueDate) { toast.error('Due date is required.'); return; }
    if (!points || points < 1) { toast.error('Points must be at least 1.'); return; }
    if (!editor) return;

    setIsSaving(true);
    const publishToast = toast.loading('Publishing assignment...');
    try {
      const res = await courseApi.createAssignment(courseId, {
        title: title.trim(),
        description: editor.getHTML(),
        totalMarks: points,
        dueDate: new Date(dueDate).toISOString(),
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      toast.success('Assignment published!', { id: publishToast });
      router.push(`/courses/${courseId}/assignments/${res.data.data._id}`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; details?: string[] } } };
      const details = apiErr.response?.data?.details;
      const msg = details?.join(', ') ?? apiErr.response?.data?.message ?? 'Failed to publish';
      toast.error(msg, { id: publishToast });
      setIsSaving(false);
    }
  };

  const titleError = touched.title && !title.trim();
  const dueDateError = touched.dueDate && !dueDate;
  const pointsError = touched.points && (!points || points < 1);
  const readyToPublish = !!title.trim() && !!dueDate && points >= 1;

  return (
    <div ref={containerRef} className="h-screen overflow-y-auto bg-[#F8FAFC]">

      {/* STICKY TOP BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-sm px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/courses/${courseId}/assignments`)}
            aria-label="Back"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 text-[9px] font-black uppercase tracking-[0.25em]">
              <Sparkles size={11} /> Strategic Assignment Builder
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate max-w-[200px]">
              {autoSaveLabel || (title ? `"${title.slice(0, 28)}${title.length > 28 ? '…' : ''}"` : 'Untitled assignment')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveDraft}
            disabled={isDraftSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {isDraftSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Target size={13} />}
            Publish
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* TITLE */}
        <div className="mb-8">
          <input
            aria-label="Assignment title"
            className={`w-full bg-transparent border-none text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter outline-none placeholder:text-slate-200`}
            placeholder="Assignment Title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => setTouched(t => ({ ...t, title: true }))}
          />
          {titleError && (
            <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> Title is required
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-6">

            {/* Rich Text Editor */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText size={12} /> Instructions
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {wordCount} words · {charCount} chars
                </span>
              </div>
              <MenuBar editor={editor} />
              <EditorContent editor={editor} />
            </div>

            {/* Rubric Builder */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRubric(r => !r)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Shield size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">Grading Rubric</p>
                    <p className="text-xs text-slate-500">
                      {rubric.length === 0 ? 'No criteria yet — click to add' : `${rubric.length} criteria · ${rubricTotal} pts total`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {rubric.length > 0 && rubricTotal !== points && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      {rubricTotal} / {points} pts
                    </span>
                  )}
                  {rubric.length > 0 && rubricTotal === points && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Balanced
                    </span>
                  )}
                  <span className="text-slate-400 text-xs">{showRubric ? '▲' : '▼'}</span>
                </div>
              </button>

              {showRubric && (
                <div className="px-6 pb-6 space-y-3 border-t border-slate-100 pt-4">
                  {rubric.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Shield size={28} className="mx-auto mb-2 text-slate-200" />
                      <p className="text-sm font-medium">No criteria yet</p>
                      <p className="text-xs mt-1">Define how this assignment will be graded</p>
                    </div>
                  ) : (
                    rubric.map((c, idx) => (
                      <div key={c.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-1">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-400"
                            placeholder="Criterion (e.g. Code Quality)"
                            value={c.label}
                            onChange={e => updateCriterion(c.id, { label: e.target.value })}
                          />
                          <input
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 outline-none focus:border-blue-400"
                            placeholder="Description (optional)"
                            value={c.description}
                            onChange={e => updateCriterion(c.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number" min={1}
                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-center text-slate-900 outline-none focus:border-blue-400"
                            value={c.points}
                            onChange={e => updateCriterion(c.id, { points: parseInt(e.target.value) || 0 })}
                          />
                          <span className="text-xs text-slate-400 font-medium">pts</span>
                          <button
                            type="button"
                            onClick={() => removeCriterion(c.id)}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-300 flex items-center justify-center transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={addCriterion}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-500 text-xs font-semibold transition-colors"
                  >
                    <Plus size={14} /> Add Criterion
                  </button>
                </div>
              )}
            </div>

            {/* Submission Types */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Globe size={16} />
                </div>
                <p className="text-sm font-semibold text-slate-900">Submission Types</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProtocolToggle label="File Upload (PDF, ZIP, DOCX)" defaultChecked={true} />
                <ProtocolToggle label="Text Entry" defaultChecked={false} />
                <ProtocolToggle label="Cloud URL (Drive, GitHub)" defaultChecked={true} />
                <ProtocolToggle label="Video Submission" defaultChecked={false} />
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="lg:col-span-4 space-y-5">

            {/* Points + Deadline */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Points</label>
                <div className="relative">
                  <input
                    type="number" min={1}
                    aria-label="Total points"
                    className={`w-full bg-slate-50 border-2 rounded-xl px-4 h-12 text-slate-900 font-black text-lg focus:bg-white transition-all outline-none ${pointsError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500'}`}
                    value={points}
                    onChange={e => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
                    onBlur={() => setTouched(t => ({ ...t, points: true }))}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">PTS</span>
                </div>
                {rubric.length > 0 && rubricTotal !== points && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} /> Rubric totals {rubricTotal} pts
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date & Time</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    aria-label="Due date"
                    className={`w-full bg-slate-50 border-2 rounded-xl px-4 h-12 text-slate-900 font-semibold text-sm focus:bg-white transition-all outline-none ${dueDateError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500'}`}
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    onBlur={() => setTouched(t => ({ ...t, dueDate: true }))}
                  />
                  <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                </div>
                {dueDateError && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={11} /> Due date is required
                  </p>
                )}
                {dueDate && !dueDateError && (
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <Clock size={11} />
                    {(() => {
                      const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
                      if (days < 0) return <span className="text-red-500">Past due</span>;
                      if (days === 0) return <span className="text-amber-500">Due today</span>;
                      return <span>{days} day{days !== 1 ? 's' : ''} from now</span>;
                    })()}
                  </p>
                )}
              </div>
            </div>

            {/* Publish Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Publish Checklist</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Title added', done: !!title.trim() },
                  { label: 'Instructions written', done: wordCount > 5 },
                  { label: 'Due date set', done: !!dueDate },
                  { label: 'Points configured', done: points >= 1 },
                  { label: 'Rubric defined', done: rubric.length > 0 },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${done ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                      {done && <CheckCircle2 size={10} className="text-white" />}
                    </div>
                    <span className={`text-xs font-medium transition-colors ${done ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handlePublish}
                disabled={isSaving || !readyToPublish}
                className="w-full mt-5 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Target size={15} />}
                Publish Assignment
              </button>
            </div>

          </div>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-slate-900 text-white shadow-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
        >
          <ChevronUp size={18} />
        </button>
      )}
    </div>
  );
}

function ProtocolToggle({ label, defaultChecked }: { label: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-100 transition-all group">
      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{label}</span>
      <button
        type="button"
        onClick={() => setChecked(!checked)}
        aria-label={`Toggle ${label}`}
        className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}
