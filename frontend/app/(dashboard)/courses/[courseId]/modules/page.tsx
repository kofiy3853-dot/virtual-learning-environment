'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/hooks/queries/useCourse';
import { useCourseModules, useAllModuleContent, ContentItem, CourseOutline, CourseOutlineModule } from '@/hooks/queries/useCourseModules';
import { useUploadContent, useDeleteContent, useToggleContentComplete, useCreateModule, useUpdateModule } from '@/hooks/queries/useModuleMutations';
import { 
  FileText, Video, Presentation, FileCode2, Image as ImageIcon, 
  ChevronDown, Plus, Trash2, Paperclip, Loader2, BookOpen,
  Calendar, Layers, Filter, Search, Info, AlertCircle,
  ArrowRight, Download, CheckCircle2, X, CircleCheck, Sparkles,
  Play, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiApi } from '@/utils/api/aiApi';

const CONTENT_CONFIG = {
  pdf:   { icon: FileText,     bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    label: 'Lecture PDF' },
  video: { icon: Video,        bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    label: 'Video Lecture' },
  slide: { icon: Presentation, bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   label: 'Lecture Slides' },
  note:  { icon: FileCode2,    bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Study Note' },
  image: { icon: ImageIcon,    bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100',  label: 'Illustration' }
};

/**
 * Converts a Cloudinary URL to a browser-openable URL.
 * Cloudinary raw uploads aren't directly viewable — this fixes the delivery type.
 */
function getOpenableUrl(url: string): string {
  if (!url) return '#';
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/raw/upload/', '/image/upload/');
}

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
  // Direct video file (mp4, webm)
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return url;
  return null;
}

export default function ModulesPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: course } = useCourse(courseId);
  const { data: modules = [], isLoading: modulesLoading, refetch: refetchModules } = useCourseModules(courseId);
  const { data: allContent = {}, isLoading: contentLoading } = useAllModuleContent(courseId, modules.map(m => m._id));
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<string | null>(null);
  
  const [showModForm, setShowModForm] = useState(false);
  const [modForm, setModForm] = useState({ title: '', description: '', weekNumber: '', order: '' });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [courseOutline, setCourseOutline] = useState<CourseOutline | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState<{ url: string; title: string } | null>(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const uploadMutation = useUploadContent();
  const deleteMutation = useDeleteContent();
  const toggleCompleteMutation = useToggleContentComplete();
  const createModuleMutation = useCreateModule();
  const updateModuleMutation = useUpdateModule();

  // Sync completed state from server data
  useEffect(() => {
    const newCompleted = new Set<string>();
    Object.values(allContent).flat().forEach(item => {
      if (item.completedBy?.includes(user?._id || '')) {
        newCompleted.add(item._id);
      }
    });
    setCompleted(newCompleted);
  }, [allContent, user?._id]);

  // Load saved AI outline for this course
  useEffect(() => {
    if (!courseId) return;
    aiApi.getCourseOutline(courseId)
      .then(res => {
        const outline = res.data?.data?.outline;
        if (outline) setCourseOutline(outline);
      })
      .catch(() => {});
  }, [courseId]);

  // Auto-expand first module
  useEffect(() => {
    if (modules.length === 0) return;
    setExpanded(prev => (Object.keys(prev).length ? prev : { [modules[0]._id]: true }));
  }, [modules]);

  const toggleModule = (moduleId: string) => {
    const willOpen = !expanded[moduleId];
    setExpanded(p => ({ ...p, [moduleId]: willOpen }));
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modForm.title || !modForm.weekNumber) {
      toast.error('Please enter a title and a week number.');
      return;
    }
    setCreating(true);
    try {
      await createModuleMutation.mutateAsync({
        courseId,
        data: {
          title: modForm.title,
          description: modForm.description,
          weekNumber: parseInt(modForm.weekNumber),
          order: parseInt(modForm.order) || modules.length + 1,
        }
      });
      setModForm({ title: '', description: '', weekNumber: '', order: '' });
      setShowModForm(false);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to create module.');
    } finally { setCreating(false); }
  };

  const handleUploadContent = async (moduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, ContentItem['type']> = { 
      pdf: 'pdf', mp4: 'video', mov: 'video', 
      ppt: 'slide', pptx: 'slide', 
      txt: 'note', md: 'note', 
      png: 'image', jpg: 'image', jpeg: 'image' 
    };
    const type = typeMap[ext] || 'note';
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name.replace(/\.[^.]+$/, ''));
    fd.append('type', type);
    fd.append('order', String(((allContent[moduleId] || [])?.length || 0) + 1));
    uploadMutation.mutate({ courseId, moduleId, data: fd }, {
      onSuccess: () => { setUploading(null); if (e.target) e.target.value = ''; },
      onError: () => { setUploading(null); if (e.target) e.target.value = ''; }
    });
  };

  const handleDeleteContent = (moduleId: string, contentId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource from the module?')) return;
    deleteMutation.mutate(contentId);
  };

  const handleToggleComplete = (contentId: string) => {
    setToggling(contentId);
    const wasCompleted = completed.has(contentId);
    setCompleted(prev => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(contentId); else next.add(contentId);
      return next;
    });
    toggleCompleteMutation.mutate(contentId, {
      onSettled: () => setToggling(null)
    });
  };

  const filteredModules = modules.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    `week ${m.weekNumber}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // AI: generate description for a module and save to MongoDB
  const handleGenerateModuleDesc = async (moduleId: string, moduleTitle: string, weekNumber: number) => {
    if (!course) return;
    setGeneratingDesc(moduleId);
    try {
      const res = await aiApi.generateLectureNotes(
        `${moduleTitle} — Week ${weekNumber} of ${course.title}`,
        []
      );
      const data = res.data?.data;
      const desc = data?.introduction
        || (data?.sections?.[0]?.content)
        || (typeof data === 'string' ? data : `Week ${weekNumber}: ${moduleTitle}`);
      await updateModuleMutation.mutateAsync({ courseId, moduleId, data: { description: desc } });
      await refetchModules();
      toast.success('Module description generated and saved.');
    } catch {
      toast.error('Failed to generate description.');
    } finally {
      setGeneratingDesc(null);
    }
  };

  // AI: generate description for the new module form
  const handleGenerateNewModuleDesc = async () => {
    if (!modForm.title || !course) {
      toast.error('Enter a module title first.');
      return;
    }
    setGeneratingDesc('new');
    try {
      const res = await aiApi.generateLectureNotes(
        `${modForm.title} — ${course.title}`,
        []
      );
      const data = res.data?.data;
      const desc = data?.introduction
        || (data?.sections?.[0]?.content)
        || (typeof data === 'string' ? data : modForm.title);
      setModForm(p => ({ ...p, description: desc }));
      toast.success('Description generated — review and save.');
    } catch {
      toast.error('Failed to generate description.');
    } finally {
      setGeneratingDesc(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto font-sans">
      
      {/* Overview Block */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-widest">
              <BookOpen size={14} /> Course Modules & Syllabus
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Syllabus & Learning Materials
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              Access the syllabus structure, download slides, watch lectures, and review study materials week-by-week.
            </p>
          </div>

          <div className="flex gap-3">
            {isTeacher && (
              <button 
                onClick={() => setShowModForm(p => !p)}
                className={`btn h-12 px-6 gap-2 text-xs font-bold shadow-sm transition-all rounded-xl ${
                  showModForm 
                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                    : 'btn-primary'
                }`}
              >
                {showModForm ? <><X size={16} /> Close Panel</> : <><Plus size={16} /> Add Module</>}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* AI Course Outline — shown when a saved outline exists */}
      {courseOutline && courseOutline.modules?.length > 0 && (
        <section className="bg-white rounded-3xl border border-violet-100 p-6 lg:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <BookOpen size={18} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Course Outline</h3>
              <p className="text-xs text-slate-500 font-medium">AI-generated weekly structure for this course</p>
            </div>
          </div>
          <div className="space-y-3">
            {courseOutline.modules.map((m: any, i: number) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex flex-col items-center justify-center shrink-0 font-bold text-xs">
                  <span className="text-[8px] uppercase tracking-wide">Wk</span>
                  <span className="text-base leading-none">{m.week ?? i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{m.title}</p>
                  {m.topics?.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {m.topics.map((t: string, j: number) => (
                        <li key={j} className="text-xs text-slate-500 flex items-start gap-1.5">
                          <span className="mt-1 w-1 h-1 rounded-full bg-violet-400 shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.learningOutcomes?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.learningOutcomes.map((o: string, j: number) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 font-semibold">{o}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Module Creation Form */}
      <AnimatePresence>
        {showModForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100 shadow-sm">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Create New Module</h3>
                  <p className="text-slate-500 text-xs font-semibold">Add a new block/week to the syllabus sequence.</p>
                </div>
              </div>

              <form onSubmit={handleCreateModule} className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-6 space-y-2">
                    <label htmlFor="mod-title" className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Module Title</label>
                    <input 
                      id="mod-title"
                      className="input-premium h-12 text-sm" 
                      placeholder="e.g., Introduction to Distributed Systems" 
                      value={modForm.title} 
                      onChange={e => setModForm(p=>({...p,title:e.target.value}))} 
                      required 
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label htmlFor="mod-week" className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Week Number</label>
                    <input 
                      id="mod-week"
                      type="number" min="1" 
                      className="input-premium h-12 text-sm" 
                      placeholder="1" 
                      value={modForm.weekNumber} 
                      onChange={e => setModForm(p=>({...p,weekNumber:e.target.value}))} 
                      required 
                    />
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <label htmlFor="mod-order" className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Syllabus Order</label>
                    <input 
                      id="mod-order"
                      type="number" min="1" 
                      className="input-premium h-12 text-sm" 
                      placeholder={String(modules.length + 1)} 
                      value={modForm.order} 
                      onChange={e => setModForm(p=>({...p,order:e.target.value}))} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label htmlFor="mod-desc" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      Module Description <span className="normal-case font-semibold opacity-60">(what students will learn this week)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateNewModuleDesc}
                      disabled={generatingDesc === 'new' || !modForm.title}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold hover:bg-violet-100 transition-all disabled:opacity-50"
                    >
                      {generatingDesc === 'new' ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      AI Fill
                    </button>
                  </div>
                  <textarea
                    id="mod-desc"
                    rows={3}
                    className="input-premium text-sm resize-none w-full"
                    placeholder="e.g., This week we cover social, legal and ethical issues in computing including privacy, intellectual property and cybercrime..."
                    value={modForm.description}
                    onChange={e => setModForm(p=>({...p,description:e.target.value}))}
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={creating} className="btn btn-primary h-12 px-6 text-xs font-bold shadow-sm">
                    {creating ? <Loader2 size={16} className="animate-spin" /> : 'Create Module'}
                  </button>
                  <button type="button" onClick={() => setShowModForm(false)} className="btn btn-secondary h-12 px-6 text-xs font-bold shadow-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search syllabus modules..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-12 pr-4 h-12 rounded-xl focus:border-primary-500 transition-all outline-none font-bold text-xs shadow-sm"
          />
        </div>
      </div>

      {/* Modules List */}
      {modulesLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white border border-slate-200 rounded-3xl animate-pulse shadow-sm" />)}
        </div>
      ) : filteredModules.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm relative group overflow-hidden"
        >
          <div className="relative z-10 space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
              <BookOpen size={36} className="text-slate-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Modules Found</h3>
              <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                {isTeacher 
                  ? 'No syllabus modules have been created. Click "Add Module" to start publishing materials.' 
                  : 'The instructor has not published any syllabus modules for this course yet.'}
              </p>
            </div>
            {isTeacher && (
              <button onClick={() => setShowModForm(true)} className="btn btn-primary h-12 px-6 text-xs font-bold shadow-sm">Add First Module</button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredModules.sort((a,b) => a.weekNumber - b.weekNumber).map((mod, idx) => {
            const isOpen = expanded[mod._id];
            const items = allContent[mod._id] || [];
            return (
              <motion.div 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                key={mod._id} 
                className={`bg-white rounded-3xl border border-slate-200 transition-all duration-300 overflow-hidden ${
                  isOpen ? 'shadow-md border-primary-200' : 'hover:border-primary-100'
                }`}
              >
                <button 
                  onClick={() => toggleModule(mod._id)} 
                  className={`w-full flex items-center gap-6 p-6 text-left transition-colors ${isOpen ? 'bg-primary-50/10' : 'hover:bg-slate-50/40'}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold transition-all duration-300 shrink-0 border border-slate-100 shadow-sm ${
                    isOpen ? 'bg-primary-500 text-white border-primary-400' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <span className="text-[8px] uppercase tracking-wider opacity-85">Week</span>
                    <span className="text-xl leading-none">{mod.weekNumber}</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-bold text-lg tracking-tight truncate transition-colors ${isOpen ? 'text-primary-600' : 'text-slate-900'}`}>{mod.title}</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        <Layers size={12} className="text-slate-400" /> {items.length} Resources
                      </span>
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                      {isStudent && items.length > 0 ? (
                        <span className="text-[9px] font-black text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                          {items.filter(it => completed.has(it._id)).length}/{items.length} Done
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">
                           Published
                        </span>
                      )}
                    </div>
                    {/* Progress bar — students only */}
                    {isStudent && items.length > 0 && (
                      <div className="w-full max-w-[200px] h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${(items.filter(it => completed.has(it._id)).length / items.length) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 border border-slate-100 ${isOpen ? 'bg-primary-500 text-white rotate-180 border-primary-400' : 'bg-white text-slate-300'}`}>
                    <ChevronDown size={18} strokeWidth={2.5} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2">
                        <div className="h-px bg-slate-100 mb-6" />
                        
                        {/* Module description */}
                        {(mod.description || isTeacher) && (
                          <div className="mb-6">
                            {mod.description ? (
                              <div className="p-4 rounded-2xl bg-primary-50/50 border border-primary-100">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">What you'll learn this week</p>
                                  {isTeacher && (
                                    <button
                                      onClick={() => handleGenerateModuleDesc(mod._id, mod.title, mod.weekNumber)}
                                      disabled={generatingDesc === mod._id}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold hover:bg-violet-100 transition-all disabled:opacity-50"
                                    >
                                      {generatingDesc === mod._id ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />}
                                      Regenerate
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">{mod.description}</p>
                              </div>
                            ) : isTeacher ? (
                              <button
                                onClick={() => handleGenerateModuleDesc(mod._id, mod.title, mod.weekNumber)}
                                disabled={generatingDesc === mod._id}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 text-violet-600 text-xs font-bold hover:bg-violet-50 transition-all disabled:opacity-50"
                              >
                                {generatingDesc === mod._id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                                {generatingDesc === mod._id ? 'Generating description...' : 'AI Generate Module Description'}
                              </button>
                            ) : null}
                          </div>
                        )}

                        {items.length === 0 ? (
                          <div className="py-12 text-center rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-2">
                            <Info size={24} className="text-slate-300" />
                            <p className="text-slate-400 font-bold text-sm">No course materials uploaded in this module yet.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {items.map((item, i) => {
                              const config = CONTENT_CONFIG[item.type] || CONTENT_CONFIG.note;
                              const Icon = config.icon;
                              return (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                                  key={item._id} 
                                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-150 hover:border-primary-200 hover:shadow-md transition-all duration-300"
                                >
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 duration-300 ${config.bg} ${config.text} ${config.border}`}>
                                    <Icon size={20} />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <h5 className="font-bold text-slate-800 text-sm truncate group-hover:text-primary-500 transition-colors tracking-tight">{item.title}</h5>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
                                        {config.label}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 md:opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-300">
                                    {/* Video preview */}
                                    {item.type === 'video' && getVideoEmbedUrl(item.fileUrl) && (
                                      <button
                                        onClick={() => setShowVideoModal({ url: getVideoEmbedUrl(item.fileUrl)!, title: item.title })}
                                        className="w-9 h-9 rounded-xl bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/10 flex items-center justify-center transition-all active:scale-90"
                                        title={`Preview ${item.title}`}
                                        aria-label={`Preview ${item.title}`}
                                      >
                                        <Play size={14} />
                                      </button>
                                    )}
                                    {/* Student: mark as complete */}
                                    {isStudent && (
                                      <button
                                        onClick={() => handleToggleComplete(item._id)}
                                        disabled={toggling === item._id}
                                        title={completed.has(item._id) ? 'Mark incomplete' : 'Mark as done'}
                                        aria-label={completed.has(item._id) ? 'Mark incomplete' : 'Mark as done'}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
                                          completed.has(item._id)
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-white text-slate-300 border-slate-200 hover:border-emerald-400 hover:text-emerald-500'
                                        }`}
                                      >
                                        {toggling === item._id
                                          ? <Loader2 size={14} className="animate-spin" />
                                          : <CircleCheck size={14} />}
                                      </button>
                                    )}
                                    <a 
                                      href={getOpenableUrl(item.fileUrl)} target="_blank" rel="noopener noreferrer" 
                                      aria-label={`Download ${item.title}`}
                                      title={`Download ${item.title}`}
                                      className="w-9 h-9 rounded-xl bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/10 flex items-center justify-center transition-all active:scale-90"
                                    >
                                      <Download size={14} />
                                    </a>
                                    {isTeacher && (
                                      <button 
                                        onClick={() => handleDeleteContent(mod._id, item._id)} 
                                        aria-label={`Delete ${item.title}`}
                                        title={`Delete ${item.title}`}
                                        className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 transition-all active:scale-90"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                        {isTeacher && (
                          <div className="mt-4">
                            <label htmlFor={`upload-${mod._id}`} className={`group relative flex flex-col items-center justify-center gap-4 w-full py-8 rounded-2xl border-2 border-dashed font-black transition-all duration-300 cursor-pointer overflow-hidden ${
                              uploading === mod._id 
                                ? 'border-primary-400 bg-primary-50 text-primary-600' 
                                : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600'
                            }`}>
                              <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              
                              {uploading === mod._id ? (
                                <>
                                  <div className="w-10 h-10 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
                                  <span className="uppercase tracking-widest text-[9px]">Uploading Course Material...</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                                    <Paperclip size={20} />
                                  </div>
                                  <div className="text-center space-y-1 relative z-10">
                                    <span className="block uppercase tracking-wider text-[10px] text-slate-800">Upload Learning Resource</span>
                                    <span className="block text-[9px] font-bold opacity-60 uppercase tracking-widest">PDF, PPT, MP4, TXT, IMAGES (MAX 50MB)</span>
                                  </div>
                                </>
                              )}
                              <input 
                                id={`upload-${mod._id}`} type="file" className="hidden" 
                                disabled={uploading === mod._id} 
                                accept=".pdf,.ppt,.pptx,.mp4,.mov,.txt,.md,.png,.jpg,.jpeg" 
                                onChange={e => handleUploadContent(mod._id, e)} 
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          }          )}
        </div>
      )}

      {/* Video Preview Modal */}
      <AnimatePresence>
        {showVideoModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowVideoModal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 truncate pr-4">{showVideoModal.title}</h3>
              <button
                onClick={() => setShowVideoModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Close video preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {showVideoModal.url.match(/youtube\.com\/embed|vimeo\.com\/video/) ? (
                <iframe
                  src={showVideoModal.url}
                  title={showVideoModal.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={showVideoModal.url}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
