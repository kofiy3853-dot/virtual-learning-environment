'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { Course } from '@/types';
import { 
  FileText, Video, Presentation, FileCode2, Image as ImageIcon, 
  ChevronDown, Plus, ExternalLink, Trash2, Paperclip, Loader2, BookOpen,
  Layout, Calendar, Layers, Sparkles, Filter, Search, Info, AlertCircle,
  ArrowRight, Download, CheckCircle2, Zap, Globe, Target, ShieldCheck,
  Package, Box, Cpu, Terminal, X
} from 'lucide-react';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface Module {
  _id: string;
  title: string;
  weekNumber: number;
  order: number;
}

interface ContentItem {
  _id: string;
  title: string;
  type: 'pdf' | 'video' | 'slide' | 'note' | 'image';
  fileUrl: string;
}

const CONTENT_CONFIG = {
  pdf:   { icon: FileText,     bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    label: 'Technical Brief' },
  video: { icon: Video,        bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100',    label: 'Visual Lecture' },
  slide: { icon: Presentation, bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   label: 'Framework' },
  note:  { icon: FileCode2,    bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Reference' },
  image: { icon: ImageIcon,    bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100',  label: 'Diagram' }
};

export default function ModulesPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  
  const [course, setCourse]    = useState<Course | null>(null);
  const [modules, setModules]  = useState<Module[]>([]);
  const [expanded, setExpanded]= useState<Record<string, boolean>>({});
  const [content, setContent]  = useState<Record<string, ContentItem[]>>({});
  const [loading, setLoading]  = useState(true);
  
  const [showModForm, setShowModForm] = useState(false);
  const [modForm, setModForm]  = useState({ title:'', weekNumber:'', order:'' });
  const [creating, setCreating]= useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const loadContent = useCallback(async (moduleId: string) => {
    if (content[moduleId]) return;
    try {
      const res = await courseApi.getModuleContent(moduleId);
      setContent(p => ({ ...p, [moduleId]: res.data.data || [] }));
    } catch { 
      setContent(p => ({ ...p, [moduleId]: [] })); 
    }
  }, [content]);

  useEffect(() => {
    async function init() {
      if (!courseId) return;
      try {
        const [c, m] = await Promise.all([
          courseApi.getOne(courseId),
          courseApi.getModules(courseId),
        ]);
        setCourse(c.data.data);
        const mods = m.data.data || [];
        setModules(mods);
        if (mods.length > 0) {
          setExpanded({ [mods[0]._id]: true });
          const res = await courseApi.getModuleContent(mods[0]._id);
          setContent(p => ({ ...p, [mods[0]._id]: res.data.data || [] }));
        }
      } catch {
        // Suppress initial fetch errors
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [courseId]);

  const toggleModule = (moduleId: string) => {
    const willOpen = !expanded[moduleId];
    setExpanded(p => ({ ...p, [moduleId]: willOpen }));
    if (willOpen) loadContent(moduleId);
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modForm.title || !modForm.weekNumber) {
      toast.error('Module parameters incomplete.');
      return;
    }
    setCreating(true);
    try {
      const res = await courseApi.createModule(courseId, {
        title: modForm.title,
        weekNumber: parseInt(modForm.weekNumber),
        order: parseInt(modForm.order) || modules.length + 1,
      });
      setModules(p => [...p, res.data.data]);
      setModForm({ title:'', weekNumber:'', order:'' });
      setShowModForm(false);
      toast.success('Curriculum node initialized.');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Initialization failed.');
    } finally { setCreating(false); }
  };

  const handleUploadContent = async (moduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, ContentItem['type']> = { 
      pdf:'pdf', mp4:'video', mov:'video', 
      ppt:'slide', pptx:'slide', 
      txt:'note', md:'note', 
      png:'image', jpg:'image', jpeg:'image' 
    };
    const type = typeMap[ext] || 'note';
    setUploading(moduleId);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', file.name.replace(/\.[^.]+$/, ''));
      fd.append('type', type);
      fd.append('order', String((content[moduleId]?.length || 0) + 1));
      const res = await courseApi.uploadContent(moduleId, fd);
      setContent(p => ({ ...p, [moduleId]: [...(p[moduleId] || []), res.data.data] }));
      toast.success('Intelligence asset synchronized.');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Sync failed.');
    } finally { setUploading(null); if (e.target) e.target.value = ''; }
  };

  const handleDeleteContent = async (moduleId: string, contentId: string) => {
    if (!window.confirm('Terminate this asset from the curriculum?')) return;
    try {
      await courseApi.deleteContent(contentId);
      setContent(p => ({ ...p, [moduleId]: p[moduleId].filter(c => c._id !== contentId) }));
      toast.success('Asset terminated.');
    } catch { 
      toast.error('Termination failed.'); 
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Immersive Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-primary-500 font-black text-[10px] uppercase tracking-[0.3em]">
            <Package size={14} />
            Curriculum Architecture
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
            Knowledge <span className="text-primary-500">Pipeline</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
            Explore the structured academic sequence of this program, featuring high-fidelity transmission modules and synchronized learning assets.
          </p>
        </div>

        {isTeacher && (
          <button 
            onClick={() => setShowModForm(p => !p)}
            className={`btn h-16 px-10 gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all ${
              showModForm 
                ? 'bg-slate-900 text-white shadow-slate-900/20' 
                : 'btn-primary shadow-primary-500/20'
            }`}
          >
            {showModForm ? <><X size={20} /> Close Terminal</> : <><Plus size={20} /> Initialize Module</>}
          </button>
        )}
      </header>

      {/* Administrative Terminal (Form) */}
      <AnimatePresence>
        {showModForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 48 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[48px] border border-slate-100 p-12 shadow-2xl shadow-primary-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center border border-primary-100 shadow-inner">
                  <Terminal size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">Deployment Console</h3>
                  <p className="text-slate-500 font-medium">Define a new block in the curriculum sequence.</p>
                </div>
              </div>

              <form onSubmit={handleCreateModule} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-6 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Module Designation</label>
                    <input 
                      className="input-premium h-16 text-lg" 
                      placeholder="e.g. Distributed Systems & Fault Tolerance" 
                      value={modForm.title} 
                      onChange={e => setModForm(p=>({...p,title:e.target.value}))} 
                      required 
                    />
                  </div>
                  <div className="lg:col-span-3 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Week Index</label>
                    <input 
                      type="number" min="1" 
                      className="input-premium h-16 text-lg" 
                      placeholder="1" 
                      value={modForm.weekNumber} 
                      onChange={e => setModForm(p=>({...p,weekNumber:e.target.value}))} 
                      required 
                    />
                  </div>
                  <div className="lg:col-span-3 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Sequence Order</label>
                    <input 
                      type="number" min="1" 
                      className="input-premium h-16 text-lg" 
                      placeholder={String(modules.length + 1)} 
                      value={modForm.order} 
                      onChange={e => setModForm(p=>({...p,order:e.target.value}))} 
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="submit" disabled={creating} className="btn btn-primary flex-1 h-16 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20">
                    {creating ? <Loader2 size={20} className="animate-spin" /> : <><Zap size={18} fill="currentColor" className="mr-2" /> Commit to Pipeline</>}
                  </button>
                  <button type="button" onClick={() => setShowModForm(false)} className="btn btn-secondary px-12 h-16 text-[10px] font-black uppercase tracking-widest">
                    Abort
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Filter Control */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search curriculum intelligence nodes..."
            className="w-full bg-white border border-slate-100 pl-16 pr-8 h-18 rounded-[32px] focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all outline-none font-bold shadow-sm text-lg placeholder:text-slate-300"
          />
        </div>
        <button className="h-18 px-10 rounded-[32px] bg-white border border-slate-100 text-slate-900 font-black flex items-center gap-3 hover:bg-slate-50 transition-all active:scale-95 text-[10px] uppercase tracking-[0.2em] shadow-sm">
          <Filter size={18} /> Global Sync
        </button>
      </div>

      {/* Module Feed */}
      {loading ? (
        <div className="space-y-8">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white border border-slate-100 rounded-[48px] animate-pulse shadow-sm" />)}
        </div>
      ) : modules.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[64px] border border-slate-100 p-32 text-center shadow-sm relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative z-10 space-y-8">
            <div className="w-28 h-28 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto border border-slate-100 shadow-inner group-hover:scale-110 transition-transform duration-700">
              <Box size={48} className="text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Pipeline Void</h3>
              <p className="text-slate-500 text-lg font-medium max-w-sm mx-auto leading-relaxed">
                {isTeacher 
                  ? 'No curriculum nodes have been initialized. Begin deployment using the terminal.' 
                  : 'The instructor has not synchronized curriculum materials for this environment.'}
              </p>
            </div>
            {isTeacher && (
              <button onClick={() => setShowModForm(true)} className="btn btn-primary h-16 px-12 font-black uppercase tracking-widest shadow-xl shadow-primary-500/10">Initialize First Block</button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {modules.sort((a,b) => a.weekNumber - b.weekNumber).map((mod, idx) => {
            const isOpen = expanded[mod._id];
            const items  = content[mod._id] || [];
            return (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                key={mod._id} 
                className={`bg-white rounded-[48px] border border-slate-100 transition-all duration-700 overflow-hidden ${isOpen ? 'ring-2 ring-primary-500/20 shadow-2xl shadow-primary-500/10' : 'hover:border-primary-200 shadow-sm'}`}
              >
                <button 
                  onClick={() => toggleModule(mod._id)} 
                  className={`w-full flex items-center gap-8 p-8 lg:p-10 text-left transition-colors ${isOpen ? 'bg-primary-50/20' : 'hover:bg-slate-50/50'}`}
                >
                  <div className={`w-20 h-20 rounded-[32px] flex flex-col items-center justify-center font-black transition-all duration-700 shrink-0 border border-slate-100 shadow-sm ${isOpen ? 'bg-primary-500 text-white border-primary-400 -translate-y-1 shadow-xl shadow-primary-500/30' : 'bg-slate-50 text-slate-400'}`}>
                    <span className="text-[9px] uppercase tracking-tighter opacity-70">Block</span>
                    <span className="text-2xl leading-none">{mod.weekNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className={`font-display font-extrabold text-2xl lg:text-3xl tracking-tight truncate transition-colors ${isOpen ? 'text-primary-600' : 'text-slate-900'}`}>{mod.title}</h4>
                      {isOpen && <Sparkles size={18} className="text-primary-400 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Cpu size={14} /> {items.length} Intelligence Assets
                      </span>
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                      <span className="text-[10px] font-black text-primary-500/60 uppercase tracking-widest flex items-center gap-2">
                         <ShieldCheck size={14} /> Synchronized
                      </span>
                    </div>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border border-slate-100 ${isOpen ? 'bg-primary-500 text-white rotate-180 border-primary-400' : 'bg-white text-slate-300'}`}>
                    <ChevronDown size={28} strokeWidth={3} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-10 pb-12 pt-4">
                        <div className="h-px bg-slate-50 mb-12" />
                        
                        {items.length === 0 ? (
                          <div className="py-20 text-center rounded-[40px] bg-slate-50/50 border border-slate-100 flex flex-col items-center space-y-6">
                            <Info size={40} className="text-slate-200" />
                            <p className="text-slate-400 font-bold text-lg">Transmission buffer empty for this node.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                            {items.map((item, i) => {
                              const config = CONTENT_CONFIG[item.type] || CONTENT_CONFIG.note;
                              const Icon = config.icon;
                              return (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                                  key={item._id} 
                                  className="group flex items-center gap-6 p-6 rounded-[32px] bg-white border border-slate-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/5 transition-all duration-500"
                                >
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 duration-700 ${config.bg} ${config.text} ${config.border}`}>
                                    <Icon size={28} />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0 space-y-1.5">
                                    <h5 className="font-display font-extrabold text-slate-800 text-lg truncate group-hover:text-primary-500 transition-colors tracking-tight">{item.title}</h5>
                                    <div className="flex items-center gap-3">
                                      <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${config.bg} ${config.text} ${config.border}`}>
                                        {config.label}
                                      </span>
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {item.type.toUpperCase()} NODE
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                                    <a 
                                      href={item.fileUrl} target="_blank" rel="noopener noreferrer" 
                                      aria-label={`Download ${item.title}`}
                                      title={`Download ${item.title}`}
                                      className="w-12 h-12 rounded-2xl bg-primary-500 text-white hover:bg-primary-600 shadow-xl shadow-primary-500/20 flex items-center justify-center transition-all active:scale-90"
                                    >
                                      <Download size={20} />
                                    </a>
                                    {isTeacher && (
                                      <button 
                                        onClick={() => handleDeleteContent(mod._id, item._id)} 
                                        aria-label={`Delete ${item.title}`}
                                        title={`Delete ${item.title}`}
                                        className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 transition-all active:scale-90"
                                      >
                                        <Trash2 size={20} />
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                        {isTeacher && (
                          <div className="mt-6">
                            <label htmlFor={`upload-${mod._id}`} className={`group relative flex flex-col items-center justify-center gap-6 w-full py-16 rounded-[48px] border-2 border-dashed font-black transition-all duration-700 cursor-pointer overflow-hidden ${
                              uploading === mod._id 
                                ? 'border-primary-400 bg-primary-50 text-primary-600' 
                                : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-600'
                            }`}>
                              <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              
                              {uploading === mod._id ? (
                                <>
                                  <div className="w-16 h-16 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
                                  <span className="uppercase tracking-[0.3em] text-[10px]">Syncing Intelligence Node...</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-20 h-20 rounded-[32px] bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-700">
                                    <Paperclip size={32} />
                                  </div>
                                  <div className="text-center space-y-2 relative z-10">
                                    <span className="block uppercase tracking-[0.3em] text-[11px] text-slate-900">Synchronize Syllabus Asset</span>
                                    <span className="block text-[10px] font-bold opacity-50 uppercase tracking-widest">PDF, MP4, SLIDES, IMAGES (MAX 50MB)</span>
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
          })}
        </div>
      )}
    </div>
  );
}
