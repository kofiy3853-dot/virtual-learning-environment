'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import {
  Video, Radio, Plus, Calendar, Clock,
  Monitor, Camera, Users, Play, Square,
  ExternalLink, Loader2, X, CheckCircle2, AlertCircle, Info,
  Wifi, ShieldCheck, Activity, Zap, Target, ArrowRight,
  Globe, Server, Lock, Sparkles
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
  scheduled: { label: 'Scheduled', cls: 'bg-amber-50 text-amber-500 border-amber-100' },
  live:      { label: '🔴 Live Now', cls: 'bg-rose-50 text-rose-600 border-rose-100' },
  ended:     { label: 'Ended', cls: 'bg-slate-50 text-slate-400 border-slate-100' },
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
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [courseId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) {
      toast.error('Session parameters incomplete.');
      return;
    }
    setCreating(true);
    try {
      const res = await courseApi.createLiveSession(courseId, form);
      setSessions(prev => [res.data.data, ...prev]);
      setShowForm(false);
      setForm({ title: '', scheduledAt: '', duration: 60, description: '' });
      toast.success('Broadcast transmission scheduled.');
    } catch {
      toast.error('Scheduling failure.');
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (sessionId: string) => {
    setActingId(sessionId);
    try {
      const res = await courseApi.startLiveSession(sessionId);
      setSessions(prev => prev.map(s => s._id === sessionId ? res.data.data : s));
      toast.success('Transmission active.');
    } catch {
      toast.error('Signal initialization failed.');
    } finally {
      setActingId(null);
    }
  };

  const handleEnd = async (sessionId: string) => {
    setActingId(sessionId);
    try {
      const res = await courseApi.endLiveSession(sessionId);
      setSessions(prev => prev.map(s => s._id === sessionId ? res.data.data : s));
      toast.success('Transmission terminated.');
    } catch {
      toast.error('Termination failure.');
    } finally {
      setActingId(null);
    }
  };

  const handleJoin = async (sessionId: string) => {
    setJoiningId(sessionId);
    try {
      const res = await courseApi.joinLiveSession(sessionId);
      window.open(res.data.data.joinUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err?.response?.data?.message || 'Access denied.';
      toast.error(msg);
    } finally {
      setJoiningId(null);
    }
  };

  const liveSessions      = sessions.filter(s => s.status === 'live');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const endedSessions     = sessions.filter(s => s.status === 'ended');

  return (
      <div className="space-y-12 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary-500 font-black text-[10px] uppercase tracking-[0.3em]">
              <Radio size={14} className={liveSessions.length ? 'text-rose-500 animate-pulse' : ''} />
              Broadcast Environment Control
            </div>
            <h1 className="text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
              Live <span className="text-primary-500">Command Center</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-xl text-lg">
              {liveSessions.length > 0
                ? `Synchronize with ${liveSessions.length} active transmissions in progress.`
                : 'Interface for real-time synchronous academic broadcasts and collaborative intelligence.'}
            </p>
          </div>

          {isTeacher && (
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary h-14 px-10 gap-3 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20"
            >
              <Plus size={20} /> Schedule Broadcast
            </button>
          )}
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 rounded-[40px] bg-white animate-pulse border border-slate-100 shadow-sm" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[48px] border border-slate-100 p-24 text-center shadow-sm relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative z-10 space-y-8">
              <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto shadow-inner border border-slate-100">
                <Monitor size={48} className="text-slate-200" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Zero Signals Detected.</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg leading-relaxed">
                  No real-time activities are currently scheduled or active in this transmission hub.
                </p>
              </div>
              {isTeacher && (
                <button onClick={() => setShowForm(true)} className="btn btn-primary h-14 px-10 font-black uppercase tracking-widest shadow-xl shadow-primary-500/10">Initialize First Signal</button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-20">
            {liveSessions.length > 0 && (
              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="h-3 w-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
                  <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Active Academic Signals</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {liveSessions.map(session => (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="group relative bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl shadow-slate-900/40 p-12 text-white"
                    >
                      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                      
                      <div className="relative z-10 flex flex-col h-full space-y-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="px-4 py-2 rounded-2xl bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-rose-500/30 backdrop-blur-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> Synchronous
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                               <Lock size={14} className="text-primary-400" /> End-to-End Secure
                            </span>
                          </div>
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Zap size={20} className="text-primary-400" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-4xl font-display font-extrabold tracking-tight leading-tight group-hover:text-primary-400 transition-colors">
                            {session.title}
                          </h3>
                          <p className="text-slate-400 text-lg font-medium line-clamp-2 leading-relaxed">
                            {session.description || 'Active transmission phase. Engage for collaborative synchronization.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-6 items-center">
                          {!isTeacher ? (
                            <button
                              onClick={() => handleJoin(session._id)}
                              disabled={joiningId === session._id}
                              className="btn bg-primary-500 hover:bg-primary-600 text-white h-16 px-12 shadow-2xl shadow-primary-500/40 font-black uppercase tracking-[0.2em] group/btn"
                            >
                              {joiningId === session._id ? <Loader2 className="animate-spin mr-3" /> : <Play size={20} fill="currentColor" className="mr-3" />}
                              Sync Signal
                            </button>
                          ) : (
                            <div className="flex gap-4 w-full sm:w-auto">
                              <button
                                onClick={() => handleEnd(session._id)}
                                disabled={actingId === session._id}
                                className="btn bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white h-16 px-10 border border-rose-500/30 font-black uppercase tracking-widest"
                              >
                                {actingId === session._id ? <Loader2 className="animate-spin mr-2" /> : <Square size={18} fill="currentColor" className="mr-2" />}
                                Terminate
                              </button>
                              {session.joinUrl && (
                                <a
                                  href={session.joinUrl} target="_blank" rel="noreferrer"
                                  className="btn bg-white/5 hover:bg-white/10 text-white h-16 px-8 border border-white/10 font-black uppercase tracking-widest flex-1 sm:flex-none"
                                >
                                  <ExternalLink size={20} className="mr-3" /> Open Terminal
                                </a>
                              )}
                            </div>
                          )}
                          <div className="flex -space-x-3 ml-auto opacity-50">
                            {[1,2,3].map(i => <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-900" />)}
                            <div className="w-10 h-10 rounded-full bg-primary-500 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black">+12</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {scheduledSessions.length > 0 && (
              <section className="space-y-10">
                <div className="flex items-center gap-4">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Future Pipeline Telemetry</h2>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {scheduledSessions.map((session, i) => (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="group relative bg-white rounded-[40px] border border-slate-100 p-10 hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-500/5 transition-all duration-700 flex flex-col shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-10">
                        <div className="w-14 h-14 rounded-[20px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all duration-700 border border-slate-100 shadow-inner">
                          <Calendar size={24} />
                        </div>
                        <span className={`text-[9px] font-black px-3.5 py-2 rounded-xl border uppercase tracking-[0.2em] shadow-sm ${STATUS_MAP.scheduled.cls}`}>
                          Confirmed
                        </span>
                      </div>

                      <h4 className="text-2xl font-display font-extrabold text-slate-900 mb-3 group-hover:text-primary-500 transition-colors tracking-tight leading-tight">
                        {session.title}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium mb-8 line-clamp-2 leading-relaxed">{session.description}</p>

                      <div className="flex flex-col gap-3 mb-10">
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Calendar size={14} className="text-primary-500" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                            <Clock size={14} className="text-primary-500" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {session.duration}m
                          </span>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-50 mt-auto">
                        {isTeacher ? (
                          <button
                            onClick={() => handleStart(session._id)}
                            disabled={actingId === session._id}
                            className="btn btn-primary w-full h-14 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/10"
                          >
                            {actingId === session._id ? <Loader2 size={16} className="animate-spin mr-3" /> : <Zap size={16} fill="currentColor" className="mr-3" />}
                            Init Signal
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary w-full h-14 text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
                          >
                            Set Reminder
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {endedSessions.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Archived Signal Logs</h2>
                  <div className="flex-1 h-px bg-slate-50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {endedSessions.map((session, i) => (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between bg-white border border-slate-100 rounded-3xl px-8 py-6 hover:border-slate-200 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:text-primary-500 transition-all border border-slate-50 shadow-inner">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-base font-display font-extrabold text-slate-600 tracking-tight group-hover:text-slate-900 transition-colors">{session.title}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {new Date(session.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {session.duration}m Duration
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50 text-slate-300 uppercase tracking-widest">
                          Archived
                        </span>
                        <button 
                          aria-label={`View details for archived session: ${session.title}`}
                          title={`View details for ${session.title}`}
                          className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                onClick={() => setShowForm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-[40px] shadow-2xl p-12 overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-rose-500" />
                
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Init Broadcast Matrix</h2>
                    <p className="text-slate-500 font-medium">Configure transmission parameters for the upcoming session.</p>
                  </div>
                  <button 
                    aria-label="Close Broadcast Schedule Modal"
                    title="Close"
                    onClick={() => setShowForm(false)} 
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors border border-slate-100 shadow-sm"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-8 relative z-10">
                  <div className="space-y-3">
                    <label htmlFor="s-title" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Signal Codename</label>
                    <input
                      id="s-title"
                      required
                      placeholder="e.g. Advanced Neural Architectures Synchronization"
                      className="input-premium h-16 text-lg"
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="s-start" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">T-Minus Start</label>
                      <input
                        id="s-start"
                        required type="datetime-local"
                        className="input-premium h-16 text-sm"
                        value={form.scheduledAt}
                        onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="s-duration" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Mission Duration (min)</label>
                      <input
                        id="s-duration"
                        required type="number" min={15} step={15}
                        className="input-premium h-16 text-lg"
                        value={form.duration}
                        onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="s-desc" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Briefing Intelligence</label>
                    <textarea
                      id="s-desc"
                      rows={4}
                      placeholder="Define the primary mission objectives for this broadcast..."
                      className="input-premium py-6 resize-none min-h-[120px]"
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1 h-16 font-black uppercase tracking-widest">
                      Abort
                    </button>
                    <button type="submit" disabled={creating} className="btn btn-primary flex-[2] h-16 shadow-2xl shadow-primary-500/20 font-black uppercase tracking-widest">
                      {creating ? <Loader2 className="animate-spin mr-3" /> : <ShieldCheck size={20} className="mr-3" />}
                      Deploy Signal
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
