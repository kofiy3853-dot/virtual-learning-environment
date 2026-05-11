'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, Calendar, CheckCircle2, XCircle, 
  Clock, Filter, Search, Plus, 
  BarChart3, UserCheck, AlertCircle, 
  ChevronRight, ArrowRight, Loader2, X, Save,
  MoreVertical, Info, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  _id: string;
  name: string;
  email: string;
}

interface AttendanceRecord {
  _id: string;
  session: {
    _id: string;
    date: string;
    topic?: string;
  };
  student: Student;
  status: 'present' | 'absent' | 'late' | 'excused';
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
  
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [myRecords, setMyRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Teacher UI state
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [markingData, setMarkingData] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSessionTopic, setNewSessionTopic] = useState('');

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const [sessRes, studRes] = await Promise.all([
          courseApi.getAttendance(courseId),
          courseApi.getStudents(courseId)
        ]);
        setSessions(sessRes.data.data || []);
        setStudents(studRes.data.data || []);
      } else {
        const res = await courseApi.getStudentAttendance(courseId);
        setMyRecords(res.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId, isTeacher]);

  const handleCreateSession = async () => {
    try {
      const res = await courseApi.createAttendanceSession(courseId, { 
        topic: newSessionTopic || 'Regular Class',
        date: new Date().toISOString()
      });
      setSessions(prev => [res.data.data, ...prev]);
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
      const res = await courseApi.getSessionRecords(sessionId);
      const existingRecords = res.data.data || [];
      const initialMarking: Record<string, any> = {};
      
      // Pre-fill with existing or default 'present'
      students.forEach(s => {
        const record = existingRecords.find((r: any) => r.student._id === s._id);
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
      await courseApi.markAttendance(activeSessionId, records);
      toast.success('Attendance saved successfully');
      setShowMarkModal(false);
      fetchData();
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
    <div className="max-w-[1200px] mx-auto p-8 lg:p-12">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <UserCheck size={14} />
            Academic Presence
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6"
          >
            Attendance <span className="text-blue-600">Tracking.</span>
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
            className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest"
          >
            <Plus size={20} strokeWidth={3} /> New Session
          </motion.button>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-[32px] animate-pulse border border-slate-200" />)}
        </div>
      ) : isTeacher ? (
        /* ── Teacher View: Sessions Grid ────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.length === 0 ? (
            <div className="col-span-full bg-white rounded-[40px] border border-slate-200 p-20 text-center shadow-sm">
               <div className="w-24 h-24 bg-blue-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                  <Calendar size={48} className="text-blue-200" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">No sessions logged yet</h3>
               <p className="text-slate-500 font-medium max-w-xs mx-auto mb-10 leading-relaxed">
                 Create a new attendance session to start tracking student participation for this course.
               </p>
               <button onClick={() => setShowSessionModal(true)} className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all uppercase tracking-widest text-sm">
                 Create First Session
               </button>
            </div>
          ) : sessions.map((session, i) => (
            <motion.div 
              key={session._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-[32px] border border-slate-200 p-8 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/5 transition-all group cursor-pointer"
              onClick={() => openMarkingModal(session._id)}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <Clock size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Date</p>
                  <p className="text-sm font-black text-slate-900">{new Date(session.date).toLocaleDateString()}</p>
                </div>
              </div>
              
              <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                {session.topic || 'Regular Session'}
              </h4>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">
                {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to mark</span>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <ArrowRight size={18} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── Student View: History ─────────────────────────────── */
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">My Attendance History</h3>
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presence Rate</span>
                  <span className="text-sm font-black text-blue-600">{myRecords.length > 0 ? Math.round((myRecords.filter(r => r.status === 'present').length / myRecords.length) * 100) : 0}%</span>
               </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Topic</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Marked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                         <AlertCircle size={40} className="text-slate-200" />
                         <p className="text-slate-400 font-bold">No attendance records found.</p>
                      </div>
                    </td>
                  </tr>
                ) : myRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="font-extrabold text-slate-900">{record.session?.topic || 'Regular Session'}</span>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-500">
                      {new Date(record.session?.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(record.status)}`}>
                        {record.status === 'present' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {record.status}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSessionModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Create Session</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Topic / Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Week 4 Lab"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 h-12 text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                    value={newSessionTopic}
                    onChange={(e) => setNewSessionTopic(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowSessionModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                  <button onClick={handleCreateSession} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">Create Session</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Marking Attendance Modal ────────────────────────────── */}
      <AnimatePresence>
        {showMarkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowMarkModal(false)} />
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Mark Attendance</h3>
                  <p className="text-slate-500 font-medium text-sm">Select status for each student in this session.</p>
                </div>
                <button onClick={() => setShowMarkModal(false)} className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 gap-3">
                  {students.map(student => (
                    <div key={student._id} className="flex items-center justify-between p-4 rounded-[24px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{student.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {['present', 'absent', 'late', 'excused'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setMarkingData(prev => ({ ...prev, [student._id]: status as any }))}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                              markingData[student._id] === status 
                                ? getStatusColor(status) + ' ring-2 ring-offset-2 ring-current ring-opacity-20'
                                : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
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

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Object.values(markingData).filter(v => v === 'present').length} Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-rose-500" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Object.values(markingData).filter(v => v === 'absent').length} Absent</span>
                    </div>
                 </div>
                 <button 
                  onClick={handleSaveAttendance} 
                  disabled={submitting}
                  className="flex items-center gap-3 px-8 h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all uppercase tracking-[0.2em] text-xs"
                 >
                   {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   {submitting ? 'Saving...' : 'Save Attendance'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
