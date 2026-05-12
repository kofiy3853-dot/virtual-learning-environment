'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import {
  Video, Radio, Plus, Calendar, Clock,
  Monitor, Camera, Users, Play, Square,
  ExternalLink, Loader2, X, CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LiveSession {
  _id: string;
  title: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'live' | 'ended';
  joinUrl: string;
  providerRoomId?: string;
  description?: string;
}

const STATUS_MAP = {
  scheduled: { label: 'Scheduled', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  live:      { label: '🔴 Live Now', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  ended:     { label: 'Ended', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function LivePage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    scheduledAt: '',
    duration: 60,
    description: '',
  });

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    const fetchSessions = () => {
      courseApi.getLiveSessions(courseId)
        .then(res => setSessions(res.data.data || []))
        .catch(() => setSessions([]))
        .finally(() => setLoading(false));
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [courseId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) {
      toast.error('Title and date/time are required.');
      return;
    }
    setCreating(true);
    try {
      const res = await courseApi.createLiveSession(courseId, form);
      setSessions(prev => [res.data.data, ...prev]);
      setShowForm(false);
      setForm({ title: '', scheduledAt: '', duration: 60, description: '' });
      toast.success('Session scheduled!');
    } catch {
      toast.error('Failed to schedule session.');
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (sessionId: string) => {
    setActingId(sessionId);
    try {
      const res = await courseApi.startLiveSession(sessionId);
      setSessions(prev => prev.map(s => s._id === sessionId ? res.data.data : s));
      toast.success('Session is now live!');
    } catch {
      toast.error('Could not start session.');
    } finally {
      setActingId(null);
    }
  };

  const handleEnd = async (sessionId: string) => {
    setActingId(sessionId);
    try {
      const res = await courseApi.endLiveSession(sessionId);
      setSessions(prev => prev.map(s => s._id === sessionId ? res.data.data : s));
      toast.success('Session ended.');
    } catch {
      toast.error('Could not end session.');
    } finally {
      setActingId(null);
    }
  };

  const handleJoin = async (sessionId: string) => {
    setJoiningId(sessionId);
    try {
      const res = await courseApi.joinLiveSession(sessionId);
      window.open(res.data.data.joinUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Cannot join yet.';
      toast.error(msg);
    } finally {
      setJoiningId(null);
    }
  };

  const liveSessions      = sessions.filter(s => s.status === 'live');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const endedSessions     = sessions.filter(s => s.status === 'ended');

  return (
    <div className="max-w-[1200px] mx-auto p-8 lg:p-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <Radio size={14} className={liveSessions.length ? 'text-rose-500 animate-pulse' : ''} />
            Synchronous Learning
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-5"
          >
            Live <span className="text-blue-600">Sessions.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed"
          >
            {liveSessions.length > 0
              ? `🔴 ${liveSessions.length} session live right now. Join instantly.`
              : 'Join real-time lectures, workshops, and office hours with your instructor.'}
          </motion.p>
        </div>

        {isTeacher && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest"
          >
            <Plus size={20} strokeWidth={3} /> Schedule Session
          </motion.button>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-slate-100 rounded-[40px] animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[48px] border border-slate-200 p-24 text-center shadow-sm"
        >
          <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center mx-auto mb-10">
            <Monitor size={48} className="text-blue-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">No sessions scheduled</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-8">
            {isTeacher
              ? 'Schedule your first live session to bring your students together in real-time.'
              : 'Check back soon — your instructor has not scheduled any sessions yet.'}
          </p>
          {isTeacher && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus size={18} /> Schedule Now
            </button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-16">
          {liveSessions.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest">Happening Now</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {liveSessions.map(session => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="relative p-10 rounded-[40px] bg-slate-900 text-white overflow-hidden shadow-2xl shadow-blue-900/20 border border-white/5 group"
                  >
                    <div className="absolute -top-6 -right-6 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                      <Camera size={160} />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-7">
                        <span className="px-3 py-1.5 rounded-full bg-rose-600/90 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Live Now
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <Users size={12} /> Live
                        </span>
                      </div>

                      <h3 className="text-2xl font-black mb-3 tracking-tight leading-snug">{session.title}</h3>
                      <p className="text-slate-400 font-medium mb-9 text-sm leading-relaxed">
                        {session.description || 'Jump in and participate in this real-time lecture session.'}
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {!isTeacher && (
                          <button
                            onClick={() => handleJoin(session._id)}
                            disabled={joiningId === session._id}
                            className="inline-flex items-center gap-3 h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-black transition-all active:scale-95 shadow-xl shadow-blue-900/40 uppercase tracking-widest disabled:opacity-60"
                          >
                            {joiningId === session._id
                              ? <Loader2 size={18} className="animate-spin" />
                              : <Play size={18} fill="currentColor" />}
                            Join Session
                          </button>
                        )}

                        {isTeacher && (
                          <button
                            onClick={() => handleEnd(session._id)}
                            disabled={actingId === session._id}
                            className="inline-flex items-center gap-3 h-14 px-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black transition-all active:scale-95 shadow-xl shadow-rose-900/30 uppercase tracking-widest disabled:opacity-60"
                          >
                            {actingId === session._id ? <Loader2 size={18} className="animate-spin" /> : <Square size={18} fill="currentColor" />}
                            End Session
                          </button>
                        )}

                        {isTeacher && session.joinUrl && (
                          <a
                            href={session.joinUrl} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-2 h-14 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-black text-xs transition-all uppercase tracking-widest"
                          >
                            <ExternalLink size={16} /> Open Room
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {scheduledSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-8 pb-6 border-b border-slate-100">
                Upcoming Schedule
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledSessions.map((session, i) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-[32px] border border-slate-200 p-7 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-7">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500">
                        <Calendar size={22} />
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${STATUS_MAP.scheduled.cls}`}>
                        {STATUS_MAP.scheduled.label}
                      </span>
                    </div>

                    <h4 className="text-lg font-extrabold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {session.title}
                    </h4>
                    {session.description && (
                      <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2 leading-relaxed">{session.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-slate-400 mb-7">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                        <Calendar size={12} />
                        {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                        <Clock size={12} />
                        {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ml-auto">
                        {session.duration}m
                      </span>
                    </div>

                    <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                      {isTeacher && (
                        <button
                          onClick={() => handleStart(session._id)}
                          disabled={actingId === session._id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/20 uppercase tracking-widest"
                        >
                          {actingId === session._id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                          Go Live
                        </button>
                      )}

                      {!isTeacher && (
                        <button
                          onClick={() => handleJoin(session._id)}
                          disabled={joiningId === session._id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 disabled:opacity-50 transition-all uppercase tracking-widest"
                        >
                          {joiningId === session._id ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                          Notify Me
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {endedSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-black text-slate-500 uppercase tracking-widest mb-6 pb-5 border-b border-slate-100">
                Past Sessions
              </h2>
              <div className="space-y-3">
                {endedSessions.map((session, i) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-6 py-4 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-500">{session.title}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {session.duration}min
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${STATUS_MAP.ended.cls} uppercase tracking-widest`}>
                      Ended
                    </span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Engagement Stats Panel (Teacher only) */}
      {isTeacher && sessions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-24 bg-white rounded-[48px] border border-slate-200 p-12 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Session Engagement Analytics.</h2>
            <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">
              Track student attendance, participation rates, and engagement duration for all your synchronous sessions.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 shrink-0">
             <div className="text-center">
                <p className="text-4xl font-black text-blue-600 tracking-tighter">92%</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Avg Attendance</p>
             </div>
             <div className="text-center">
                <p className="text-4xl font-black text-blue-600 tracking-tighter">4.8/5</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Satisfaction</p>
             </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white border border-slate-200 rounded-[32px] shadow-2xl p-8 sm:p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Schedule a Session</h2>
                  <p className="text-sm font-medium text-slate-500">Set up a new live class for your students.</p>
                </div>
                <button
                  aria-label="Close"
                  onClick={() => setShowForm(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label htmlFor="ls-title" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Session Title
                  </label>
                  <input
                    id="ls-title" required
                    placeholder="e.g. Week 3 Lecture — Neural Networks"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 font-bold text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ls-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Date & Time
                    </label>
                    <input
                      id="ls-date" required type="datetime-local"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 font-bold text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={form.scheduledAt}
                      onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="ls-dur" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Duration (min)
                    </label>
                    <input
                      id="ls-dur" required type="number" min={15} max={360} step={15}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-slate-900 font-bold text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                      value={form.duration}
                      onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ls-desc" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Description <span className="text-slate-400 normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="ls-desc" rows={3}
                    placeholder="What will students learn in this session?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none leading-relaxed"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-6 h-11 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating}
                    className="flex items-center gap-2 px-8 h-11 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-50 transition-all">
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                    {creating ? 'Scheduling...' : 'Schedule Session'}
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
