'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, Megaphone, Plus, Search, Filter, 
  ChevronRight, Calendar, User, Clock, 
  Sparkles, Pin, MoreVertical, Trash2, 
  Edit3, MessageCircle, Info, Loader2,
  Send, X, AlertCircle, CheckCircle2
} from 'lucide-react';
import { AxiosError } from 'axios';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  isPinned?: boolean;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    role: string;
  };
}

export default function AnnouncementsPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);

  const isTeacher = user?.role === 'teacher';
  // Check if owner logic (simplified for UI)
  const isOwner = isTeacher; 

  const showToast = (msg: string, type: string = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await courseApi.getAnnouncements(courseId);
      setAnnouncements(res.data.data || []);
    } catch (err) {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await courseApi.createAnnouncement(courseId, form);
      setAnnouncements(p => [res.data.data, ...p]);
      setForm({ title: '', body: '' });
      setShowForm(false);
      showToast('Announcement broadcast successfully!');
    } catch (err) {
      const error = err as AxiosError<{message: string}>;
      showToast(error.response?.data?.message || 'Failed to post announcement.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    (a.body || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1200px] mx-auto p-4 lg:p-0">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-8 left-1/2 z-50 px-6 py-3 rounded-full font-bold shadow-xl border flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 pt-8">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <Bell size={14} />
            Communication Hub
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6"
          >
            Course <span className="text-blue-600">Announcements.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed"
          >
            Stay updated with the latest news, deadlines, and important updates directly from your instructors.
          </motion.p>
        </div>

        {isOwner && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest ${
              showForm ? 'bg-white border border-slate-200 text-slate-600' : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
            }`}
          >
            {showForm ? 'Cancel' : <><Plus size={20} strokeWidth={3} /> New Post</>}
          </motion.button>
        )}
      </header>

      {/* Creation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 48 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[32px] border-2 border-blue-100 p-8 lg:p-10 shadow-xl shadow-blue-900/5">
              <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Broadcast Announcement</h3>
              <form onSubmit={handleCreate}>
                <div className="space-y-6 mb-8">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Announcement Title *</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 h-14 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none" placeholder="e.g. Schedule Modification for Week 4" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Message Content *</label>
                    <textarea rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-5 text-slate-900 focus:bg-white focus:border-blue-500 transition-all outline-none font-medium resize-none" placeholder="Provide detailed information for students..." value={form.body} onChange={e => setForm({...form, body: e.target.value})} required />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="submit" disabled={creating} className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                    {creating ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    Post Announcement
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-10 h-14 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search announcements..."
            className="w-full bg-white border border-slate-200 text-slate-900 pl-14 pr-6 h-16 rounded-2xl focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all outline-none font-bold shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="h-16 px-8 rounded-2xl bg-white border border-slate-200 text-slate-600 font-black flex items-center gap-3 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest text-xs">
          <Filter size={18} /> Filters
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-[32px] animate-pulse border border-slate-200" />)}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] border border-slate-200 p-20 text-center shadow-sm"
        >
          <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
            <Megaphone size={40} className="text-blue-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Quiet in the halls.</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
            There are no announcements for this course yet. Check back later for updates!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {filteredAnnouncements.map((ann, i) => {
            const isExpanded = expanded[ann._id];
            const isLong = ann.body?.length > 280;
            const displayContent = isLong && !isExpanded ? ann.body.slice(0, 280) + '...' : ann.body;

            return (
              <motion.div
                key={ann._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative bg-white rounded-[32px] border border-slate-200 p-8 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500"
              >
                {ann.isPinned && (
                  <div className="absolute top-8 right-8 text-blue-600 flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest">Pinned</span>
                    <Pin size={16} fill="currentColor" />
                  </div>
                )}
                
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shrink-0 border border-slate-100">
                    <Megaphone size={28} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <User size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{ann.author?.name || 'Instructor'}</span>
                      </div>
                      <div className="hidden md:block w-1 h-1 rounded-full bg-slate-200" />
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                      {ann.title}
                    </h3>
                    <div className="text-slate-600 font-medium leading-relaxed mb-6 whitespace-pre-wrap">
                      {displayContent}
                    </div>

                    {isLong && (
                      <button 
                        onClick={() => setExpanded({ ...expanded, [ann._id]: !isExpanded })}
                        className="text-blue-600 text-xs font-black uppercase tracking-[0.2em] hover:text-blue-800 transition-colors mb-8 block"
                      >
                        {isExpanded ? 'Show Less' : 'Read Full Announcement'}
                      </button>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex gap-4">
                         <button className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest">
                           <MessageCircle size={16} /> Community Feedback
                         </button>
                      </div>
                      
                      {isOwner && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button aria-label="Delete announcement" title="Delete announcement" className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-100"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Engagement Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="mt-16 bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden group shadow-2xl"
      >
        <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div className="max-w-xl">
            <h2 className="text-3xl font-black mb-4 tracking-tight leading-none uppercase">Never miss an update.</h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              We recommend enabling push notifications to stay synchronized with course schedule changes, new resources, and peer discussions.
            </p>
          </div>
          <button className="h-16 px-10 rounded-2xl bg-white text-slate-900 font-black text-lg hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-xl uppercase tracking-widest shrink-0">
            Enable Alerts
          </button>
        </div>
      </motion.div>
    </div>
  );
}
