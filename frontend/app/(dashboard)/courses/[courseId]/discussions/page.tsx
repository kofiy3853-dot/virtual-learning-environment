'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useCourseDiscussions } from '@/hooks/queries/useCourseResources';
import { queryKeys } from '@/lib/queryKeys';
import { communicationApi } from '@/utils/api/communicationApi';
import { useAuth } from '@/context/AuthContext';
import {
  MessageSquare, Plus, Search, ThumbsUp, Reply,
  Loader2, X, Send, Inbox, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Discussion {
  _id: string;
  title: string;
  body: string;
  author: { _id: string; name: string; role: string };
  replies: unknown[];
  likes: string[];
  isPinned: boolean;
  createdAt: string;
}

export default function DiscussionsPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: discussionsData = [], isLoading: loading } = useCourseDiscussions(courseId);
  const discussions = discussionsData as Discussion[];

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    setPosting(true);
    try {
      await communicationApi.startDiscussion(courseId, form);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.discussions(courseId) });
      setShowForm(false);
      setForm({ title: '', body: '' });
      toast.success('Discussion posted.');
    } catch {
      toast.error('Failed to post discussion.');
    } finally {
      setPosting(false);
    }
  };

  const filtered = discussions.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <MessageSquare size={20} className="text-slate-400" /> Discussions
          </h1>
          <p className="page-subtitle mt-0.5">Ask questions and collaborate with your classmates.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm gap-1.5 self-start sm:self-auto">
          <Plus size={14} /> New Discussion
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card">
          <p className="section-label mb-1">Threads</p>
          <p className="text-xl font-bold text-slate-900">{discussions.length}</p>
        </div>
        <div className="stat-card">
          <p className="section-label mb-1">Total Replies</p>
          <p className="text-xl font-bold text-primary-600">
            {discussions.reduce((s, d) => s + d.replies.length, 0)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            aria-label="Search discussions"
            className="input-premium pl-8 h-8 text-xs w-full"
            placeholder="Search discussions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
          <Inbox size={20} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Discussions Yet</h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {search ? 'No discussions match your search.' : 'Be the first to start a discussion.'}
          </p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm mt-4 gap-1.5">
              <Plus size={13} /> Start Discussion
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((disc, i) => (
            <motion.div
              key={disc._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {disc.author.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {disc.title}
                    </h3>
                    {disc.isPinned && (
                      <span className="px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 border border-primary-100 text-[10px] font-semibold shrink-0">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 mb-2 line-clamp-2">{disc.body}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{disc.author.name}</span>
                      <span>·</span>
                      <span>{format(new Date(disc.createdAt), 'MMM d, yyyy')}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={10} /> {disc.likes.length}</span>
                      <span className="flex items-center gap-1"><Reply size={10} /> {disc.replies.length}</span>
                    </div>
                    <Link
                      href={`/courses/${courseId}/discussions/${disc._id}`}
                      className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      View <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              className="relative bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl p-6 space-y-5 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-base font-semibold text-slate-900">New Discussion</h3>
                <button onClick={() => setShowForm(false)} aria-label="Close" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="disc-title" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Title *</label>
                  <input
                    id="disc-title" required
                    placeholder="e.g. Question about Chapter 3 concepts"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="disc-content" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Content *</label>
                  <textarea
                    id="disc-content" required rows={5}
                    placeholder="Share your question or thoughts..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none"
                    value={form.body}
                    onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1 text-sm">Cancel</button>
                  <button type="submit" disabled={posting} className="btn btn-primary flex-[2] text-sm gap-1.5">
                    {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {posting ? 'Posting...' : 'Post Discussion'}
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
