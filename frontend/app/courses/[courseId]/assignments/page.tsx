'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { Course } from '@/types';
import { 
  FileText, Calendar, Clock, Trophy, ChevronRight, 
  Plus, Loader2, CheckCircle2, AlertCircle, LucideIcon
} from 'lucide-react';
import { AxiosError } from 'axios';

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
}

interface Submission {
  _id: string;
  status: 'submitted' | 'graded' | 'late' | 'pending';
  grade?: number;
}

const statusBadge: Record<string, { bg: string, text: string, border: string, label: string, icon: LucideIcon }> = {
  submitted: { bg:'bg-blue-50',     text:'text-blue-700',    border:'border-blue-100',    label:'Submitted', icon: CheckCircle2 },
  graded:    { bg:'bg-emerald-50',  text:'text-emerald-700', border:'border-emerald-100', label:'Graded',    icon: CheckCircle2 },
  late:      { bg:'bg-rose-50',     text:'text-rose-700',    border:'border-rose-100',    label:'Late',      icon: AlertCircle },
  pending:   { bg:'bg-slate-100',   text:'text-slate-600',   border:'border-slate-200',   label:'Pending',   icon: Clock },
};

function daysLeft(dueDate: string) {
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0)  return { text:'Overdue', color:'text-rose-600', bg:'bg-rose-50' };
  if (days === 0)return { text:'Due today', color:'text-amber-600', bg:'bg-amber-50' };
  if (days === 1)return { text:'Due tomorrow', color:'text-amber-600', bg:'bg-amber-50' };
  return { text:`${days} days left`, color:'text-slate-500', bg:'bg-slate-50' };
}

export default function AssignmentsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user }               = useAuth();
  
  const [course, setCourse]        = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading]      = useState(true);
  
  const [showForm, setShowForm]    = useState(false);
  const [form, setForm]            = useState({ title:'', description:'', dueDate:'', totalMarks:'' });
  const [creating, setCreating]    = useState(false);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isOwner = isTeacher && (
    (typeof course?.teacher === 'object' && course.teacher?._id === user?._id) ||
    (course?.teacher === user?._id)
  );

  useEffect(() => {
    let ignore = false;
    async function startFetching() {
      if (!courseId) return;
      try {
        const [c, a] = await Promise.all([
          courseApi.getOne(courseId),
          courseApi.getAssignments(courseId),
        ]);
        
        let subMap: Record<string, Submission> = {};
        if (user?.role === 'student') {
          try {
            const s = await courseApi.getMySubmissions(courseId);
            s.data.data.forEach((sub: any) => {
              subMap[sub.assignment] = sub;
            });
          } catch {}
        }

        if (!ignore) {
          setCourse(c.data.data);
          setAssignments(a.data.data || []);
          setSubmissions(subMap);
        }
      } catch (err) {
        if (!ignore) alert('Failed to load data');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    startFetching();
    return () => { ignore = true; };
  }, [courseId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate || !form.totalMarks) return;
    setCreating(true);
    try {
      const res = await courseApi.createAssignment(courseId, {
        ...form,
        totalMarks: parseInt(form.totalMarks),
      });
      setAssignments(p => [...p, res.data.data]);
      setForm({ title:'', description:'', dueDate:'', totalMarks:'' });
      setShowForm(false);
    } catch (err) {
      const error = err as AxiosError<{message: string}>;
      alert(error.response?.data?.message || 'Failed to create assignment.');
    } finally { setCreating(false); }
  };

  return (
    <div className="max-w-[1000px] mx-auto p-8 lg:p-12">
      
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <FileText size={14} />
            Academic Tasks
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-6"
          >
            Course <span className="text-blue-600">Assignments.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg font-medium max-w-xl leading-relaxed"
          >
            Manage your submissions, track deadlines, and view detailed academic feedback.
          </motion.p>
        </div>

        {isOwner && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowForm(p => !p)}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all hover:-translate-y-1 active:scale-95 uppercase tracking-widest ${
              showForm 
                ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' 
                : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
            }`}
          >
            {showForm ? 'Cancel' : <><Plus size={20} strokeWidth={3} /> New Assignment</>}
          </motion.button>
        )}
      </header>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[24px] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6">New Assignment</h3>
              <form onSubmit={handleCreate}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 mb-8">
                  <div className="sm:col-span-6">
                    <label htmlFor="assign-title" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignment Title *</label>
                    <input id="assign-title" title="Assignment Title" className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" placeholder="e.g. Algorithm Analysis" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="assign-marks" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Marks *</label>
                    <input id="assign-marks" title="Total Marks" type="number" min="1" className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" placeholder="100" value={form.totalMarks} onChange={e => setForm(p=>({...p,totalMarks:e.target.value}))} required />
                  </div>
                  <div className="sm:col-span-3">
                    <label htmlFor="assign-due" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date *</label>
                    <input id="assign-due" title="Due Date" type="datetime-local" className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 h-12 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm" value={form.dueDate} onChange={e => setForm(p=>({...p,dueDate:e.target.value}))} required />
                  </div>
                  <div className="sm:col-span-12">
                    <label htmlFor="assign-desc" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea id="assign-desc" title="Description" rows={3} className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-4 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none" placeholder="Describe the assignment requirements..." value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="submit" disabled={creating} className="h-12 px-8 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2">
                    {creating ? <Loader2 size={18} className="animate-spin" /> : 'Create Assignment'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="h-12 px-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-200/50 rounded-[24px] animate-pulse" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <FileText size={32} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">No assignments yet</h3>
          <p className="text-slate-500 font-medium">
            {isOwner ? 'Create the first assignment for this course.' : 'No assignments have been posted yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a, idx) => {
            const dl = daysLeft(a.dueDate);
            const sub = submissions[a._id];
            const sb = statusBadge[sub?.status || 'pending'];
            const StatusIcon = sb.icon;
            
            return (
              <motion.div 
                key={a._id}
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              >
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[24px] bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all">
                  
                  <div className="flex gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <FileText size={24} className="text-indigo-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-lg font-extrabold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{a.title}</h3>
                        {isStudent && (
                          <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${sb.bg} ${sb.text} ${sb.border}`}>
                            <StatusIcon size={12} /> {sb.label}
                          </span>
                        )}
                      </div>
                      
                      {a.description && <p className="text-sm font-medium text-slate-500 mb-3 line-clamp-1">{a.description}</p>}
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar size={14} />
                          {new Date(a.dueDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${dl.bg} ${dl.color}`}>
                          <Clock size={14} /> {dl.text}
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <Trophy size={14} /> {a.totalMarks} marks
                        </div>
                        {sub?.grade !== undefined && (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 size={14} /> {sub.grade}/{a.totalMarks}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-0 sm:pl-6 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-6 sm:pt-0">
                    <Link href={`/courses/${courseId}/assignments/${a._id}`} 
                      className={`flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold transition-all ${
                        isStudent && !sub 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5' 
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}>
                      {isOwner ? 'Submissions' : isStudent && !sub ? 'Submit Work' : 'View Details'}
                      <ChevronRight size={18} className={isStudent && !sub ? 'text-white/70' : 'text-slate-400'} />
                    </Link>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
