'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { communicationApi } from '@/utils/api/communicationApi';
import { courseApi } from '@/utils/api/courseApi';
import {
  MessageSquare, ArrowLeft, Send, ThumbsUp,
  Pin, Hash, Loader2, Reply, User as UserIcon, Clock,
  Shield, Brain, Target, ChevronLeft, ArrowRight, Sparkles,
  TrendingUp, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/layouts/DashboardLayout';

interface Reply {
  _id: string;
  author: { _id: string; name: string };
  body: string;
  createdAt: string;
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: { _id: string; name: string; role: string };
  replies: Reply[];
  likes: string[];
  isPinned: boolean;
  tags?: string[];
  createdAt: string;
}

export default function DiscussionThreadPage() {
  const { courseId, discussionId } = useParams() as { courseId: string; discussionId: string };
  const { user } = useAuth();

  const [thread, setThread] = useState<Discussion | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch thread
  useEffect(() => {
    communicationApi.getDiscussion(discussionId)
      .then(res => setThread(res.data.data))
      .catch(() => toast.error('Failed to synchronize intelligence.'))
      .finally(() => setLoading(false));
  }, [discussionId]);

  // Auto-scroll on new replies
  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.replies?.length, loading]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setPosting(true);
    try {
      const res = await communicationApi.replyDiscussion(discussionId, { content: replyText });
      setThread(res.data.data);
      setReplyText('');
      toast.success('Transmission stored.');
    } catch {
      toast.error('Transmission failed.');
    } finally {
      setPosting(false);
    }
  };

  const avatarLetter = (name: string) => name?.charAt(0)?.toUpperCase() ?? '?';
  const formatTime = (d: string) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing Dialogue Node...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-32 text-center space-y-8">
          <div className="w-24 h-24 rounded-[32px] bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto shadow-inner">
            <MessageSquare size={40} className="text-rose-400" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Intelligence Node Severed.</h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">The requested dialogue thread is unreachable or has been archived.</p>
          </div>
          <Link href={`/courses/${courseId}/discussions`}
            className="btn btn-primary h-14 px-10 gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/10">
            <ChevronLeft size={16} /> Re-establish Link
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1000px] mx-auto space-y-12 pb-20">
        {/* Header / Back nav */}
        <Link
          href={`/courses/${courseId}/discussions`}
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary-500 uppercase tracking-[0.3em] group transition-colors"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Dialogue Terminal
        </Link>

        {/* ── Original Post ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-[40px] p-12 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[20px] bg-slate-900 flex items-center justify-center text-white font-display font-black text-lg shadow-xl shadow-slate-900/10 group-hover:bg-primary-500 transition-colors duration-700">
                {avatarLetter(thread.author.name)}
              </div>
              <div>
                <p className="text-lg font-display font-extrabold text-slate-900 leading-none mb-1.5">{thread.author.name}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={12} className="text-primary-500" /> {formatTime(thread.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {thread.isPinned && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20">
                  <Pin size={12} fill="currentColor" /> Pinned
                </div>
              )}
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {thread.author.role}
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-tight mb-8 relative z-10">
            {thread.title}
          </h1>
          <p className="text-slate-600 leading-relaxed font-medium text-lg mb-10 whitespace-pre-wrap relative z-10">
            {thread.content}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-slate-50 relative z-10">
            {(thread.tags || ['General']).map(tag => (
              <span key={tag} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                <Hash size={12} /> {tag}
              </span>
            ))}
            <div className="ml-auto flex items-center gap-8">
              <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-primary-500 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-all border border-slate-100">
                  <ThumbsUp size={16} />
                </div>
                <span className="text-sm font-black">{thread.likes.length}</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-primary-500 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition-all border border-slate-100">
                  <Reply size={16} />
                </div>
                <span className="text-sm font-black">{thread.replies.length} Intelligence Units</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Replies ───────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Users size={16} className="text-primary-500" /> Synchronization Feed <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
          </div>

          {thread.replies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white border border-slate-100 rounded-[32px] p-20 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold tracking-tight">Zero replies detected. Initialize first response sequence.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {thread.replies.map((reply, idx) => (
                <motion.div
                  key={reply._id ?? idx}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                  className={`flex gap-6 p-8 rounded-[32px] border transition-all group ${
                    reply.author._id === thread.author._id
                      ? 'bg-primary-50/30 border-primary-100/50 shadow-sm'
                      : 'bg-white border-slate-100 shadow-sm hover:border-primary-100'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-xs font-black shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 ${
                    reply.author._id === thread.author._id
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    {avatarLetter(reply.author.name)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-base font-display font-extrabold text-slate-900">{reply.author.name}</span>
                        {reply.author._id === thread.author._id && (
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-lg bg-primary-500 text-white uppercase tracking-widest shadow-md shadow-primary-500/20">OP Intelligence</span>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatTime(reply.createdAt)}</span>
                    </div>
                    <p className="text-slate-600 font-medium leading-relaxed text-base whitespace-pre-wrap">{reply.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Reply Composer ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-600" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500">
              <Send size={16} />
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronization Sequence</h3>
          </div>
          
          <div className="flex gap-6">
            <div className="w-12 h-12 rounded-[18px] bg-slate-900 flex items-center justify-center text-white font-display font-black text-sm shrink-0 shadow-xl shadow-slate-900/10">
              {avatarLetter(user?.name ?? 'U')}
            </div>
            <form onSubmit={handleReply} className="flex-1 space-y-6">
              <textarea
                rows={4}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Synchronize your academic insights with the cohort..."
                className="input-premium py-6 min-h-[140px] resize-none text-lg"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={posting || !replyText.trim()}
                  className="btn btn-primary h-14 px-10 gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20"
                >
                  {posting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {posting ? 'Transmitting...' : 'Broadcast Transmission'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
