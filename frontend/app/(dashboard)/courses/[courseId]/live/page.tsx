'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { courseApi } from '@/utils/api/courseApi';
import { useCourseLiveSessions } from '@/hooks/queries/useCourseResources';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/context/AuthContext';
import JitsiRoom from '@/components/live/JitsiRoom';
import {
  Video, Radio, Plus, Calendar, Clock,
  Play, Square, Loader2, X,
  CheckCircle2, PhoneOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

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

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  live:      { label: 'Live Now',   cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  ended:     { label: 'Ended',      cls: 'bg-slate-50 text-slate-500 border-slate-200' },
};

export default function LivePage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessionsData = [], isLoading: loading } = useCourseLiveSessions(courseId, true, { refetchInterval: 30000 });
  const sessions = sessionsData as LiveSession[];

  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', scheduledAt: '', duration: 60, description: '' });
  const [isEnrolled, setIsEnrolled] = useState(true);

  // Active Jitsi room state
  const [activeRoom, setActiveRoom] = useState<{ roomId: string; sessionId: string; title: string } | null>(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  // Check enrollment for students when sessions are empty
  useEffect(() => {
    if (isStudent && !loading && sessions.length === 0) {
      // Check if enrolled by trying to get student attendance (requires enrollment)
      courseApi.getStudentAttendance(courseId)
        .then(res => setIsEnrolled(res.data?.success !== false))
        .catch(() => setIsEnrolled(false));
    } else {
      setIsEnrolled(true);
    }
  }, [isStudent, loading, sessions.length, courseId]);

  const invalidateSessions = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.liveSessions(courseId) });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.scheduledAt) { toast.error('Title and start time are required.'); return; }
    setCreating(true);
    try {
      await courseApi.createLiveSession(courseId, form);
      await invalidateSessions();
      setShowForm(false);
      setForm({ title: '', scheduledAt: '', duration: 60, description: '' });
      toast.success('Session scheduled.');
    } catch {
      toast.error('Failed to schedule session.');
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (session: LiveSession) => {
    setActingId(session._id);
    try {
      const res = await courseApi.startLiveSession(courseId, session._id);
      await invalidateSessions();
      // Use providerRoomId from the API response (most reliable source)
      const started = res.data.data;
      const room = started.providerRoomId
        || session.providerRoomId
        || started.joinUrl?.split('/').pop()
        || null;
      if (room) {
        setActiveRoom({ roomId: room, sessionId: session._id, title: session.title });
      }
      toast.success('Session started.');
    } catch {
      toast.error('Failed to start session.');
    } finally {
      setActingId(null);
    }
  };

  const handleEnd = async (sessionId: string) => {
    setActingId(sessionId);
    try {
      await courseApi.endLiveSession(courseId, sessionId);
      await invalidateSessions();
      setActiveRoom(null);
      toast.success('Session ended.');
    } catch {
      toast.error('Failed to end session.');
    } finally {
      setActingId(null);
    }
  };

  const handleJoin = async (session: LiveSession) => {
    setActingId(session._id);
    try {
      const res = await courseApi.joinLiveSession(courseId, session._id);
      const { roomId, joinUrl } = res.data.data;

      // Use roomId from API first, then fall back to extracting from joinUrl
      const room = roomId
        || session.providerRoomId
        || joinUrl?.split('/').pop()
        || null;

      if (!room) {
        toast.error('Room ID not available. Try the link below.');
        if (joinUrl) window.open(joinUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      setActiveRoom({ roomId: room, sessionId: session._id, title: session.title });
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Unable to join session.');
    } finally {
      setActingId(null);
    }
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
  };

  const liveSessions      = sessions.filter(s => s.status === 'live');
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const endedSessions     = sessions.filter(s => s.status === 'ended');

  // ── ACTIVE ROOM VIEW ──────────────────────────────────────────────────────
  if (activeRoom) {
    const activeSession = sessions.find(s => s._id === activeRoom.sessionId);
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] gap-3">
        {/* Room header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {activeRoom.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Live session in progress</p>
          </div>
          <div className="flex items-center gap-2">
            {isTeacher && activeSession && (
              <button
                onClick={() => handleEnd(activeRoom.sessionId)}
                disabled={actingId === activeRoom.sessionId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition-all"
              >
                {actingId === activeRoom.sessionId ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
                End for Everyone
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              <PhoneOff size={12} /> Leave
            </button>
          </div>
        </div>

        {/* Jitsi embed */}
        <div className="flex-1 min-h-0">
          <JitsiRoom
            roomId={activeRoom.roomId}
            displayName={user?.name ?? 'User'}
            onLeave={handleLeaveRoom}
            isHost={isTeacher}
          />
        </div>
      </div>
    );
  }

  // ── SESSIONS LIST VIEW ────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">

      {/* Header Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-widest">
              <Radio size={14} /> Live Broadcasting
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Live Sessions
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              {liveSessions.length > 0
                ? `${liveSessions.length} session${liveSessions.length > 1 ? 's' : ''} live now - Join or manage real-time classes`
                : 'Schedule and manage real-time class sessions with your students'}
            </p>
          </div>

          {isTeacher && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary h-12 px-6 gap-2 text-xs font-bold shadow-sm transition-all rounded-xl self-start md:self-auto"
            >
              <Plus size={16} /> Schedule Session
            </button>
          )}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
            <Video size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sessions</p>
            <p className="text-2xl font-extrabold text-slate-900">{sessions.length}</p>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Calendar size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upcoming</p>
            <p className="text-2xl font-extrabold text-amber-600">{scheduledSessions.length}</p>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(scheduledSessions.length / Math.max(sessions.length, 1)) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
            <p className="text-2xl font-extrabold text-emerald-600">{endedSessions.length}</p>
          </div>
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(endedSessions.length / Math.max(sessions.length, 1)) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200 shadow-sm">
          <Video size={20} className="text-slate-300 mx-auto mb-2" />
          {isStudent && !isEnrolled ? (
            <>
              <h3 className="text-sm font-semibold text-slate-700">Enroll to Access Live Sessions</h3>
              <p className="text-[11px] text-slate-400 mt-1">You must be enrolled in this course to view and join live sessions.</p>
              <button
                onClick={() => window.location.href = `/courses/${courseId}`}
                className="btn btn-primary btn-sm mt-4 gap-1.5"
              >
                <Video size={13} /> Go to Course & Enroll
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-slate-700">No Sessions Yet</h3>
              <p className="text-[11px] text-slate-400 mt-1">No live sessions have been scheduled.</p>
              {isTeacher && (
                <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm mt-4 gap-1.5">
                  <Plus size={13} /> Schedule First Session
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Live Now */}
          {liveSessions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Live Now</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {liveSessions.map(session => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl border border-rose-200 p-6 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group"
                  >
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Live Now
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{session.title}</h3>
                      {session.description && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{session.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                      <Clock size={14} className="text-slate-400" /> {session.duration} minutes
                    </div>
                    <div className="flex gap-2">
                      {!isTeacher ? (
                        <button
                          onClick={() => handleJoin(session)}
                          disabled={actingId === session._id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-60"
                        >
                          {actingId === session._id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                          Join Session
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleJoin(session)}
                            disabled={actingId === session._id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all disabled:opacity-60"
                          >
                            {actingId === session._id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                            Rejoin
                          </button>
                          <button
                            onClick={() => handleEnd(session._id)}
                            disabled={actingId === session._id}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-all disabled:opacity-60"
                          >
                            {actingId === session._id ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                            End
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Scheduled */}
          {scheduledSessions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Upcoming Sessions</h2>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledSessions.map((session, i) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-amber-200 hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold border border-amber-200 mb-3`}>
                        Scheduled
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2">{session.title}</h3>
                      {session.description && (
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{session.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5 mb-4 pb-4 border-b border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{format(new Date(session.scheduledAt), 'MMM d, yyyy · h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span>{session.duration} minutes</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      {isTeacher ? (
                        <button
                          onClick={() => handleStart(session)}
                          disabled={actingId === session._id}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all disabled:opacity-60"
                        >
                          {actingId === session._id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                          Start Session
                        </button>
                      ) : (
                        <button disabled className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-500 text-xs font-bold border border-slate-200 cursor-not-allowed">
                          Not started yet
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Ended */}
          {endedSessions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Past Sessions</h2>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="space-y-3">
                {endedSessions.map((session, i) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-emerald-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">{session.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(session.scheduledAt), 'MMM d, yyyy')} · {session.duration} min
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-200`}>
                      Completed
                    </span>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Schedule Session Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Schedule Live Session</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Powered by Jitsi Meet — no account needed.</p>
                </div>
                <button onClick={() => setShowForm(false)} aria-label="Close" className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="s-title" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Session Title *</label>
                  <input
                    id="s-title" required
                    placeholder="e.g. Week 5 — Data Structures Review"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="s-start" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Start Time *</label>
                    <input
                      id="s-start" required type="datetime-local"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                      value={form.scheduledAt}
                      onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="s-duration" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Duration (min)</label>
                    <input
                      id="s-duration" required type="number" min={15} step={15}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                      value={form.duration}
                      onChange={e => setForm(p => ({ ...p, duration: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="s-desc" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Description (Optional)</label>
                  <textarea
                    id="s-desc" rows={3}
                    placeholder="What will be covered in this session?"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary flex-1 text-sm">Cancel</button>
                  <button type="submit" disabled={creating} className="btn btn-primary flex-[2] text-sm gap-1.5">
                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Video size={13} />}
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
