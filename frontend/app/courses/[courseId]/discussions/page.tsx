'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { communicationApi } from '@/utils/api/communicationApi';
import { useAuth } from '@/context/AuthContext';
import { 
  MessageSquare, MessageCircle, Plus, Search, Filter, 
  ChevronRight, Calendar, User, Clock, 
  Sparkles, Pin, MoreVertical, Trash2, 
  Edit3, ThumbsUp, Reply, Hash, Loader2, X, Send,
  TrendingUp, Users, Brain, Shield, Target, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Reply {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    role: string;
  };
  replies: Reply[];
  likes: string[];
  isPinned: boolean;
  createdAt: string;
  tags?: string[];
}

export default function DiscussionsPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    courseApi.getDiscussions(courseId)
      .then(res => setDiscussions(res.data.data || []))
      .catch(() => setDiscussions([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Intelligence title and content required.');
      return;
    }
    setPosting(true);
    try {
      const res = await communicationApi.startDiscussion(courseId, form);
      setDiscussions(prev => [res.data.data, ...prev]);
      setShowForm(false);
      setForm({ title: '', content: '' });
      toast.success('Communication thread initialized!');
    } catch {
      toast.error('Initialization failed.');
    } finally {
      setPosting(false);
    }
  };

  const filteredDiscussions = discussions.filter(d => 
    d.title.toLowerCase().includes(search.toLowerCase()) || 
    d.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary-500 font-black text-[10px] uppercase tracking-[0.3em]">
            <Brain size={14} /> Knowledge Exchange Hub
          </div>
          <h1 className="text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
            Peer <span className="text-primary-500">Discussions</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl text-lg">
            Synchronize intelligence, share academic insights, and collaborate with your peers in real-time.
          </p>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-primary h-14 px-10 gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20"
        >
          <Plus size={20} /> Initialize Thread
        </button>
      </header>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            aria-label="Search discussions"
            title="Search discussions"
            placeholder="Query the intelligence bank..."
            className="input-premium pl-16 h-16 text-lg"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary h-16 px-10 gap-3 text-[10px] font-black uppercase tracking-widest">
          <Filter size={20} /> Filter Matrix
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-72 bg-white rounded-[40px] animate-pulse border border-slate-100 shadow-sm" />)}
        </div>
      ) : filteredDiscussions.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[48px] border border-slate-100 p-24 text-center shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative z-10 space-y-8">
            <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner border border-slate-100">
              <MessageCircle size={48} className="text-slate-200" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Zero Active Threads.</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg leading-relaxed">
                The communication terminal is currently silent. Be the catalyst for a new academic discussion.
              </p>
            </div>
            <button onClick={() => setShowForm(true)} className="btn btn-primary h-14 px-10 font-black uppercase tracking-widest shadow-xl shadow-primary-500/10">Initialize First Thread</button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredDiscussions.map((disc, i) => (
            <motion.div
              key={disc._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative bg-white rounded-[40px] border border-slate-100 p-10 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-500/5 transition-all duration-700 flex flex-col shadow-sm"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-[18px] bg-slate-50 flex items-center justify-center text-slate-400 font-display font-black text-sm border border-slate-100 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 group-hover:rotate-3 transition-all duration-700 shadow-inner">
                     {disc.author.name.charAt(0)}
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-900 leading-none mb-1">{disc.author.name}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(disc.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                   </div>
                </div>
                {disc.isPinned && (
                  <div className="px-3 py-1.5 rounded-xl bg-primary-50 text-primary-500 border border-primary-100">
                    <Pin size={14} fill="currentColor" />
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-display font-extrabold text-slate-900 mb-4 tracking-tight leading-tight group-hover:text-primary-500 transition-colors relative z-10">
                {disc.title}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2 text-base relative z-10">
                {disc.content}
              </p>

              <div className="flex flex-wrap gap-2 mb-10 relative z-10">
                 {(disc.tags || ['General', 'Question']).map(tag => (
                   <span key={tag} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:bg-primary-50 group-hover:text-primary-500 group-hover:border-primary-100 transition-all duration-500 shadow-sm">
                     <Hash size={12} /> {tag}
                   </span>
                 ))}
              </div>

              <div className="mt-auto flex items-center justify-between pt-8 border-t border-slate-50 relative z-10">
                <div className="flex gap-8">
                  <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-primary-500 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-all">
                      <ThumbsUp size={16} />
                    </div>
                    <span className="text-sm font-black">{disc.likes.length}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-primary-500 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-all">
                      <Reply size={16} />
                    </div>
                    <span className="text-sm font-black">{disc.replies.length}</span>
                  </div>
                </div>
                <Link href={`/courses/${courseId}/discussions/${disc._id}`} className="flex items-center gap-3 px-6 py-3 rounded-[20px] bg-slate-900 text-white font-display font-black text-[10px] hover:bg-primary-500 hover:-translate-y-1 transition-all uppercase tracking-[0.2em] group/btn shadow-lg shadow-slate-900/10 hover:shadow-primary-500/20">
                  Engage Thread <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-[40px] shadow-2xl p-12 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-blue-600" />
              
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                  <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Initialize Communication Thread</h2>
                  <p className="text-slate-500 font-medium">Broadcast your query to the academic cohort.</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)} 
                  aria-label="Close modal"
                  title="Close modal"
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors border border-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-8">
                <div className="space-y-3">
                  <label htmlFor="thread-codename" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Thread Codename</label>
                  <input
                    id="thread-codename"
                    required
                    placeholder="e.g. Theoretical Synthesis in Quantum Computing"
                    className="input-premium h-16 text-lg"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-3">
                  <label htmlFor="technical-content" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Technical Content</label>
                  <textarea
                    id="technical-content"
                    required
                    rows={5}
                    placeholder="Detail your inquiry or share your synthesis..."
                    className="input-premium py-6 min-h-[160px] resize-none"
                    value={form.content}
                    onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1 h-16 font-black uppercase tracking-widest">Cancel</button>
                  <button type="submit" disabled={posting} className="btn btn-primary flex-[2] h-16 font-black uppercase tracking-widest shadow-2xl shadow-primary-500/20">
                    {posting ? <Loader2 className="animate-spin" /> : <Send size={20} className="mr-2" />}
                    {posting ? 'Transmitting...' : 'Broadcast Thread'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
