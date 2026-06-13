'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { courseApi } from '@/utils/api/courseApi';
import { useCourseAttendance } from '@/hooks/queries/useCourseResources';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, Calendar, CheckCircle2, XCircle, 
  Clock, Filter, Search, Plus, 
  BarChart3, UserCheck, AlertCircle, 
  ChevronRight, ArrowRight, Loader2, X, Save,
  MoreVertical, Info, RefreshCw, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  _id: string;
  name: string;
  email: string;
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceRecord {
  _id: string;
  session: {
    _id: string;
    date: string;
    topic?: string;
  };
  student: Student;
  status: AttendanceStatus;
  markedAt: string;
}

interface AttendanceSession {
  _id: string;
  date: string;
  topic?: string;
  teacher: string;
  course: string;
}

export default function AttendancePage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  
  const queryClient = useQueryClient();
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const role = isTeacher ? 'teacher' : 'student';
  const { data: attendanceData, isLoading: loading } = useCourseAttendance(courseId, role);
  const sessions = (attendanceData?.sessions ?? []) as AttendanceSession[];
  const myRecords = (attendanceData?.studentRecords ?? []) as AttendanceRecord[];
  const students = (attendanceData?.students ?? []) as Student[];

  // Teacher UI state
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [markingData, setMarkingData] = useState<Record<string, AttendanceStatus>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSessionTopic, setNewSessionTopic] = useState('');

  const invalidateAttendance = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.attendance(courseId, role) });

  const handleCreateSession = async () => {
    try {
      const res = await courseApi.createAttendanceSession(courseId, { 
        topic: newSessionTopic || 'Regular Class',
        date: new Date().toISOString()
      });
      await invalidateAttendance();
      setShowSessionModal(false);
      setNewSessionTopic('');
      toast.success('Session created');
      
      // Open marking modal for the new session
      openMarkingModal(res.data.data._id);
    } catch (err) {
      toast.error('Failed to create session');
    }
  };

  const openMarkingModal = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowMarkModal(true);
    try {
      const res = await courseApi.getSessionRecords(courseId, sessionId);
      const existingRecords = res.data.data || [];
      const initialMarking: Record<string, AttendanceStatus> = {};
      
      // Pre-fill with existing or default 'present'
      students.forEach(s => {
        const record = existingRecords.find((r: AttendanceRecord) => r.student._id === s._id);
        initialMarking[s._id] = record ? record.status : 'present';
      });
      setMarkingData(initialMarking);
    } catch (err) {
      toast.error('Failed to load session records');
    }
  };

  const handleSaveAttendance = async () => {
    if (!activeSessionId) return;
    setSubmitting(true);
    try {
      const records = Object.entries(markingData).map(([studentId, status]) => ({
        studentId,
        status
      }));
      await courseApi.markAttendance(courseId, activeSessionId, records);
      toast.success('Attendance saved successfully');
      setShowMarkModal(false);
    } catch (err) {
      toast.error('Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'absent':  return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'late':    return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'excused': return 'bg-blue-50 text-blue-700 border-blue-100';
      default:        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-primary-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <UserCheck size={14} />
            Academic Presence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-none mb-6"
          >
            Attendance <span className="text-primary-500">Tracking.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed"
          >
            {isTeacher 
              ? 'Manage course sessions and verify student participation in real-time.' 
              : 'Keep track of your attendance history and maintain your academic standing.'}
          </motion.p>
        </div>

        {isTeacher && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowSessionModal(true)}
            className="flex items-center justify-center gap-3 px-8 h-16 rounded-2xl bg-primary-500 text-white font-black shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest text-[10px]"
          >
            <Plus size={20} strokeWidth={3} /> New Session
          </motion.button>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white rounded-[48px] animate-pulse border border-slate-100 shadow-sm" />)}
        </div>
      ) : isTeacher ? (
        /* ── Teacher View: Sessions Grid ────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sessions.length === 0 ? (
            <div className="col-span-full bg-white rounded-[64px] border border-slate-100 p-24 text-center shadow-sm relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="relative z-10">
                 <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                    <Calendar size={48} className="text-slate-200" />
                 </div>
                 <h3 className="text-3xl font-display font-extrabold text-slate-900 mb-4 tracking-tight">No sessions logged yet</h3>
                 <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10 leading-relaxed text-lg">
                   Create a new attendance session to start tracking student participation for this course.
                 </p>
                 <button onClick={() => setShowSessionModal(true)} className="btn btn-primary h-14 px-10 font-black uppercase tracking-widest text-[10px]">
                   Create First Session
                 </button>
               </div>
            </div>
          ) : sessions.map((session, i) => (
            <motion.div 
              key={session._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[40px] border border-slate-100 p-10 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-900/5 transition-all group cursor-pointer shadow-sm"
              onClick={() => openMarkingModal(session._id)}
            >
              <div className="flex items-center justify-between mb-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all duration-700 border border-slate-50 shadow-inner">
                  <Clock size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Date</p>
                  <p className="text-sm font-extrabold text-slate-900">{new Date(session.date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <h4 className="text-2xl font-display font-extrabold text-slate-900 mb-2 tracking-tight group-hover:text-primary-600 transition-colors leading-tight">
                {session.topic || 'Regular Session'}
              </h4>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-10">
                {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>

              <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mark Engagement</span>
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── Student View: History ─────────────────────────────── */
        <div className="bg-white rounded-[56px] border border-slate-100 overflow-hidden shadow-2xl shadow-primary-500/5">
          <div className="p-12 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">Attendance Ledger</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Cohort participation history</p>
            </div>
            <div className="flex items-center gap-6 bg-white px-8 py-4 rounded-3xl border border-slate-100 shadow-sm">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presence Rate</span>
                  <span className="text-2xl font-display font-extrabold text-primary-500">
                    {myRecords.length > 0 ? Math.round((myRecords.filter(r => r.status === 'present').length / myRecords.length) * 100) : 0}%
                  </span>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-500 border border-primary-100 shadow-inner">
                  <BarChart3 size={24} />
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-slate-50">
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Module / Topic</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Date Vector</th>
                  <th className="px-12 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Status Signal</th>
                  <th className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Marked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-12 py-32 text-center group">
                      <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-slate-100 group-hover:scale-110 transition-transform duration-700 shadow-inner">
                         <AlertCircle size={40} className="text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-extrabold text-xl">No participation signals detected.</p>
                    </td>
                  </tr>
                ) : myRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-12 py-8">
                      <span className="font-display font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-primary-600 transition-colors">{record.session?.topic || 'Regular Session'}</span>
                    </td>
                    <td className="px-12 py-8 text-sm font-bold text-slate-500 uppercase tracking-widest">
                      {new Date(record.session?.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-12 py-8">
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(record.status)}`}>
                        {record.status === 'present' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {record.status}
                      </div>
                    </td>
                    <td className="px-12 py-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                      {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── New Session Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showSessionModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowSessionModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 30 }} 
              className="relative w-full max-w-md bg-white rounded-[48px] border border-slate-100 p-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary-500" />
              <div className="flex justify-between items-start mb-10">
                <h3 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight leading-tight">Init Session</h3>
                <button 
                  aria-label="Close session initialization modal"
                  title="Close"
                  onClick={() => setShowSessionModal(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-rose-500 transition-colors border border-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-10">
                <div className="space-y-3">
                  <label htmlFor="sess-topic" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Session Codename</label>
                  <input 
                    id="sess-topic"
                    type="text" 
                    placeholder="e.g. Laboratory Synthesis Week 4"
                    className="input-premium h-16 text-lg"
                    value={newSessionTopic}
                    onChange={(e) => setNewSessionTopic(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowSessionModal(false)} className="btn btn-secondary flex-1 h-14 font-black uppercase tracking-widest text-[10px]">Abort</button>
                  <button onClick={handleCreateSession} className="btn btn-primary flex-[2] h-14 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary-500/20">Launch Session</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Marking Attendance Modal ────────────────────────────── */}
      <AnimatePresence>
        {showMarkModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowMarkModal(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.98 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 100, scale: 0.98 }} 
              className="relative w-full max-w-4xl bg-white border border-slate-100 rounded-[64px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] pointer-events-none" />
              
              <div className="p-12 border-b border-slate-50 flex items-center justify-between relative z-10 bg-white/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-primary-500 text-white flex items-center justify-center shadow-xl shadow-primary-500/20">
                    <UserCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Presence Verification</h3>
                    <p className="text-slate-500 font-medium text-lg">Synchronize participation states for this academic cohort.</p>
                  </div>
                </div>
                <button 
                  aria-label="Close presence verification modal"
                  title="Close"
                  onClick={() => setShowMarkModal(false)} 
                  className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-slate-100 shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 scrollbar-premium relative z-10">
                <div className="grid grid-cols-1 gap-4">
                  {students.map(student => (
                    <div key={student._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[32px] border border-slate-100 bg-white hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 transition-all group">
                      <div className="flex items-center gap-6 mb-6 sm:mb-0">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary-500 font-display font-extrabold text-xl border border-slate-100 group-hover:bg-primary-500 group-hover:text-white transition-all duration-700 shadow-inner">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-display font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-primary-600 transition-colors">{student.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {['present', 'absent', 'late', 'excused'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setMarkingData(prev => ({ ...prev, [student._id]: status as AttendanceStatus }))}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                              markingData[student._id] === status 
                                ? getStatusColor(status) + ' ring-4 ring-offset-0 ring-current ring-opacity-10 scale-105 shadow-xl shadow-current/10'
                                : 'bg-white border border-slate-100 text-slate-400 hover:border-slate-200'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-12 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
                 <div className="flex gap-10">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{Object.values(markingData).filter(v => v === 'present').length} Present Nodes</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{Object.values(markingData).filter(v => v === 'absent').length} Missing Assets</span>
                    </div>
                 </div>
                 <div className="flex gap-4 w-full sm:w-auto">
                   <button onClick={() => setShowMarkModal(false)} className="btn btn-secondary flex-1 sm:flex-none px-10 h-16 font-black uppercase tracking-widest text-[10px]">Cancel</button>
                   <button 
                    onClick={handleSaveAttendance} 
                    disabled={submitting}
                    className="btn btn-primary flex-1 sm:flex-none px-12 h-16 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary-500/20"
                   >
                     {submitting ? <Loader2 size={18} className="animate-spin mr-3" /> : <ShieldCheck size={20} className="mr-3" />}
                     {submitting ? 'Transmitting...' : 'Commit Attendance'}
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
