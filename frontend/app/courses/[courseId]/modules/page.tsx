'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { Course } from '@/types';
import { 
  FileText, Video, Presentation, FileCode2, Image as ImageIcon, 
  ChevronDown, Plus, ExternalLink, Trash2, Paperclip, Loader2, BookOpen
} from 'lucide-react';

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

const contentMeta = {
  pdf:   { icon: FileText,     bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100' },
  video: { icon: Video,        bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-100' },
  slide: { icon: Presentation, bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100' },
  note:  { icon: FileCode2,    bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  image: { icon: ImageIcon,    bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-100' }
};

export default function ModulesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user }               = useAuth();
  
  const [course, setCourse]    = useState<Course | null>(null);
  const [modules, setModules]  = useState<Module[]>([]);
  const [expanded, setExpanded]= useState<Record<string, boolean>>({});
  const [content, setContent]  = useState<Record<string, ContentItem[]>>({});
  const [loading, setLoading]  = useState(true);
  
  const [showModForm, setShowModForm] = useState(false);
  const [modForm, setModForm]  = useState({ title:'', weekNumber:'', order:'' });
  const [creating, setCreating]= useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const isTeacher = user?.role === 'teacher';
  const isOwner = isTeacher && (
    (typeof course?.teacher === 'object' && course.teacher?._id === user?._id) ||
    (course?.teacher === user?._id)
  );

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
    let ignore = false;
    async function startFetching() {
      if (!courseId) return;
      try {
        const [c, m] = await Promise.all([
          courseApi.getOne(courseId),
          courseApi.getModules(courseId),
        ]);
        if (!ignore) {
          setCourse(c.data.data);
          const mods = m.data.data || [];
          setModules(mods);
          if (mods.length > 0) {
            setExpanded({ [mods[0]._id]: true });
            courseApi.getModuleContent(mods[0]._id).then(res => {
              if (!ignore) setContent(p => ({ ...p, [mods[0]._id]: res.data.data || [] }));
            });
          }
        }
      } catch (err) {} finally {
        if (!ignore) setLoading(false);
      }
    }
    startFetching();
    return () => { ignore = true; };
  }, [courseId]);

  const toggleModule = (moduleId: string) => {
    const willOpen = !expanded[moduleId];
    setExpanded(p => ({ ...p, [moduleId]: willOpen }));
    if (willOpen) loadContent(moduleId);
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modForm.title || !modForm.weekNumber) return;
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
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create module.');
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
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed.');
    } finally { setUploading(null); if (e.target) e.target.value = ''; }
  };

  const handleDeleteContent = async (moduleId: string, contentId: string) => {
    try {
      await courseApi.deleteContent(contentId);
      setContent(p => ({ ...p, [moduleId]: p[moduleId].filter(c => c._id !== contentId) }));
    } catch { 
      alert('Delete failed.'); 
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Course Modules</h2>
          <p className="text-slate-500 font-medium">{modules.length} module{modules.length !== 1 ? 's' : ''} structured for this course</p>
        </div>
        {isOwner && (
          <button 
            onClick={() => setShowModForm(p => !p)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
              showModForm 
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-0.5'
            }`}
          >
            {showModForm ? 'Cancel' : <><Plus size={18} /> Add Module</>}
          </button>
        )}
      </div>

      {/* Create Module Form */}
      <AnimatePresence>
        {showModForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6">Create New Module</h3>
              <form onSubmit={handleCreateModule}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-8">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Module Title *</label>
                    <input className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" placeholder="e.g. Week 1 — Introduction" value={modForm.title} onChange={e => setModForm(p=>({...p,title:e.target.value}))} required />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Week Number *</label>
                    <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" placeholder="1" value={modForm.weekNumber} onChange={e => setModForm(p=>({...p,weekNumber:e.target.value}))} required />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Order</label>
                    <input type="number" min="1" className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" placeholder={String(modules.length + 1)} value={modForm.order} onChange={e => setModForm(p=>({...p,order:e.target.value}))} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="submit" disabled={creating} className="h-12 px-8 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2">
                    {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create Module'}
                  </button>
                  <button type="button" onClick={() => setShowModForm(false)} className="h-12 px-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-200/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <BookOpen size={32} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">No modules yet</h3>
          <p className="text-slate-500 font-medium">
            {isOwner ? 'Create your first module to start adding course materials.' : 'No modules have been published for this course yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.sort((a,b) => a.weekNumber - b.weekNumber).map(mod => {
            const isOpen = expanded[mod._id];
            const items  = content[mod._id] || [];
            return (
              <div key={mod._id} className={`bg-white rounded-[24px] border transition-all duration-300 ${isOpen ? 'border-blue-300 shadow-xl shadow-blue-900/5' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                
                {/* Module Header */}
                <button onClick={() => toggleModule(mod._id)} className="w-full flex items-center gap-4 p-5 text-left">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg transition-colors shrink-0 ${isOpen ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                    W{mod.weekNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-extrabold text-lg truncate transition-colors ${isOpen ? 'text-blue-700' : 'text-slate-900'}`}>{mod.title}</h4>
                    <p className="text-sm font-medium text-slate-500">Week {mod.weekNumber} · {items.length} items</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                    <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Content Items */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                        {items.length === 0 ? (
                          <div className="py-6 text-center rounded-2xl bg-slate-50 border border-slate-100 border-dashed">
                            <p className="text-slate-500 font-medium">No content has been added to this module yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3 mb-6">
                            {items.map((item, idx) => {
                              const meta = contentMeta[item.type] || contentMeta.note;
                              const MetaIcon = meta.icon;
                              return (
                                <motion.div 
                                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                  key={item._id} 
                                  className="group flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all"
                                >
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${meta.bg} ${meta.color} ${meta.border}`}>
                                    <MetaIcon size={20} />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-slate-900 truncate mb-1">{item.title}</h5>
                                    <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${meta.bg} ${meta.color} ${meta.border}`}>
                                      {item.type}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                      <ExternalLink size={18} />
                                    </a>
                                    {isOwner && (
                                      <button onClick={() => handleDeleteContent(mod._id, item._id)} className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                        <Trash2 size={18} />
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        )}

                        {/* Upload Button */}
                        {isOwner && (
                          <label className={`flex items-center justify-center gap-2 w-full h-14 rounded-xl border-2 border-dashed font-bold transition-all cursor-pointer ${
                            uploading === mod._id 
                              ? 'border-blue-300 bg-blue-50 text-blue-600' 
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
                          }`}>
                            {uploading === mod._id ? (
                              <><Loader2 size={18} className="animate-spin" /> Uploading...</>
                            ) : (
                              <><Paperclip size={18} /> Upload Material</>
                            )}
                            <input type="file" className="hidden" disabled={uploading === mod._id} accept=".pdf,.ppt,.pptx,.mp4,.mov,.txt,.md,.png,.jpg,.jpeg" onChange={e => handleUploadContent(mod._id, e)} />
                          </label>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
