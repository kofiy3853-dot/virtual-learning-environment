'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import { Course } from '@/types';
import { 
  FileText, Calendar, Clock, Trophy, ChevronRight, 
  Plus, Loader2, CheckCircle2, AlertCircle, LucideIcon,
  Filter, ArrowUpRight, Inbox, X, Shield, Target, Zap,
  TrendingUp, Activity, Cpu, Briefcase, LayoutGrid, Search, ArrowRight
} from 'lucide-react';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface Assignment {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  totalMarks: number;
}

interface Submission {
  _id: string;
  assignment: string;
  status: 'submitted' | 'graded' | 'late' | 'pending';
  grade?: number;
}

const statusBadge: Record<string, { bg: string, text: string, border: string, label: string, icon: LucideIcon }> = {
  submitted: { bg:'bg-primary-50', text:'text-primary-600', border:'border-primary-100', label:'Transmission Sent', icon: CheckCircle2 },
  graded: { bg:'bg-emerald-50', text:'text-emerald-600', border:'border-emerald-100', label:'Evaluated', icon: Trophy },
  late: { bg:'bg-rose-50', text:'text-rose-600', border:'border-rose-100', label:'Overdue', icon: AlertCircle },
  pending: { bg:'bg-slate-50', text:'text-slate-400', border:'border-slate-100', label:'Open Mission', icon: Activity },
};

function daysLeft(dueDate: string) {
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { text:'Operational Deadline Passed', color:'text-rose-500', bg:'bg-rose-50' };
  if (days === 0) return { text:'Final Threshold Today', color:'text-amber-500', bg:'bg-amber-50' };
  if (days === 1) return { text:'Terminal Day Remaining', color:'text-amber-500', bg:'bg-amber-50' };
  return { text:`${days} Days Remaining`, color:'text-slate-400', bg:'bg-slate-50' };
}

export default function AssignmentsPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', dueDate:'', totalMarks:'' });
  const [creating, setCreating] = useState(false);

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isOwner = isTeacher && (
    (typeof course?.teacher === 'object' ? course.teacher._id === user?._id : course?.teacher === user?._id) || 
    user?.role === 'admin'
  );

  useEffect(() => {
    const loadData = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const [c, a] = await Promise.all([
          courseApi.getOne(courseId),
          courseApi.getAssignments(courseId),
        ]);
        
        const subMap: Record<string, Submission> = {};
        if (user?.role === 'student') {
          try {
            const s = await courseApi.getMySubmissions(courseId);
            s.data.data.forEach((sub: Submission) => {
              subMap[sub.assignment] = sub;
            });
          } catch (e) {
            console.error('Failed to load student submissions', e);
          }
        }

        setCourse(c.data.data);
        setAssignments(a.data.data || []);
        setSubmissions(subMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId, user?.role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.dueDate || !form.totalMarks) {
      toast.error('Required parameters missing.');
      return;
    }
    setCreating(true);
    try {
      const res = await courseApi.createAssignment(courseId, {
        ...form,
        totalMarks: parseInt(form.totalMarks),
        dueDate: new Date(form.dueDate).toISOString(),
      });
      const newAssignment = res.data.data;
      toast.success('Mission deployment successful.');
      router.push(`/courses/${courseId}/assignments/${newAssignment._id}`);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || 'Deployment failed.');
    } finally { 
      setCreating(false); 
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12 pb-20">
      {/* Immersive Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 text-primary-500 font-black text-[10px] uppercase tracking-[0.3em]">
            <Briefcase size={14} />
            Mission Control Hub
          </div>
          <h1 className="text-5xl lg:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-none">
            Academic <span className="text-primary-500">Backlog</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl text-lg leading-relaxed">
            Strategic objective management for academic cohorts. Track requirements, monitor deadlines, and submit terminal outcomes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
           <div className="relative group w-full sm:w-auto">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500 transition-colors" size={18} />
             <input 
               id="mission-search" 
               aria-label="Search mission backlog" 
               className="bg-white border border-slate-100 rounded-[24px] pl-16 pr-6 h-16 text-sm font-bold focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all w-full sm:w-80 shadow-sm" 
               placeholder="Search mission backlog..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
           </div>
           {isTeacher && (
             <button 
               onClick={() => setShowForm(true)}
               className="btn btn-primary h-16 px-10 gap-3 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary-500/20 w-full sm:w-auto"
             >
               <Plus size={20} strokeWidth={3} /> Deploy Mission
             </button>
           )}
        </div>
      </header>

      {/* Deployment Modal Overlay */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-2xl bg-white border border-slate-100 rounded-[64px] shadow-2xl p-12 lg:p-16 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              
              <div className="flex justify-between items-start mb-12 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 flex items-center justify-center border border-primary-100 shadow-inner">
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Deploy New Mission</h2>
                    <p className="text-sm font-medium text-slate-500">Define assessment objectives for the cohort.</p>
                  </div>
                </div>
                <button 
                  aria-label="Close deployment modal"
                  title="Close"
                  onClick={() => setShowForm(false)} 
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-900 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-8 relative z-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label htmlFor="mission-title" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Mission Codename</label>
                    <input id="mission-title" required className="input-premium h-16 text-lg" placeholder="e.g. Advanced Neural Architecture" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label htmlFor="mission-marks" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Performance Weight</label>
                      <input id="mission-marks" type="number" required className="input-premium h-16 text-lg" placeholder="100" value={form.totalMarks} onChange={e => setForm(p=>({...p,totalMarks:e.target.value}))} />
                    </div>
                    <div className="space-y-3">
                      <label htmlFor="mission-deadline" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Operational Deadline</label>
                      <input id="mission-deadline" type="datetime-local" required className="input-premium h-16 text-sm" value={form.dueDate} onChange={e => setForm(p=>({...p,dueDate:e.target.value}))} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="mission-description" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Technical Specifications</label>
                    <textarea id="mission-description" rows={4} className="input-premium py-6 resize-none min-h-[140px] text-lg" placeholder="Outline the primary academic objectives..." value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={creating} className="btn btn-primary flex-1 h-16 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20">
                    {creating ? <Loader2 size={20} className="animate-spin mr-2" /> : <><Shield size={20} className="mr-2" /> Deploy Assessment</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-[48px] bg-white border border-slate-100 animate-pulse shadow-sm" />)}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="py-40 text-center bg-white rounded-[64px] border border-slate-100 shadow-2xl shadow-primary-500/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="w-28 h-28 bg-slate-50 rounded-[40px] shadow-inner mx-auto flex items-center justify-center mb-10 border border-slate-100 group-hover:scale-110 transition-transform duration-700 relative z-10">
            <Inbox size={48} className="text-slate-200" />
          </div>
          <h3 className="text-3xl font-display font-extrabold text-slate-900 mb-3 relative z-10">Backlog Depleted</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto mb-12 text-lg relative z-10">No active missions detected. The academic backlog is currently clear.</p>
          {isTeacher && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary h-16 px-12 text-[10px] font-black uppercase tracking-widest relative z-10">Establish First Mission</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAssignments.map((a, idx) => {
            const dl = daysLeft(a.dueDate);
            const sub = submissions[a._id];
            const sb = statusBadge[sub?.status || 'pending'];
            const StatusIcon = sb.icon;
            
            return (
              <motion.div 
                key={a._id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="group bg-white rounded-[40px] border border-slate-100 p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-700 relative overflow-hidden shadow-sm group-hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="flex flex-col sm:flex-row gap-10 items-center flex-1 min-w-0 relative z-10">
                  <div className="w-20 h-20 rounded-[28px] bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-primary-500 group-hover:text-white transition-all duration-700 shadow-inner group-hover:shadow-xl group-hover:shadow-primary-500/20 group-hover:-rotate-3">
                    <FileText size={32} />
                  </div>
                  
                  <div className="space-y-4 flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap justify-center sm:justify-start">
                      <h3 className="text-2xl font-display font-extrabold text-slate-900 group-hover:text-primary-600 transition-colors tracking-tight truncate max-w-md">{a.title}</h3>
                      {isStudent && (
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${sb.bg} ${sb.text} ${sb.border}`}>
                          <StatusIcon size={14} /> {sb.label}
                        </div>
                      )}
                    </div>
                    
                    {a.description && <p className="text-slate-500 font-medium line-clamp-1 leading-relaxed max-w-2xl text-sm">{a.description}</p>}
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-10 gap-y-4 pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={14} className="text-primary-500" />
                        {new Date(a.dueDate).toLocaleDateString(undefined,{day:'numeric',month:'short', year: 'numeric'})}
                      </div>
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${dl.color}`}>
                        <Clock size={14} /> {dl.text}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        <Trophy size={14} /> {a.totalMarks} Performance Weight
                      </div>
                      {sub?.grade !== undefined && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                          <TrendingUp size={14} /> {sub.grade}/{a.totalMarks} Grade Yield
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center sm:justify-end gap-4 shrink-0 relative z-10">
                  <Link href={`/courses/${courseId}/assignments/${a._id}`} 
                    className={`h-16 px-12 rounded-[24px] font-display font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all duration-500 shadow-xl active:scale-95 ${
                      isStudent && !sub 
                        ? 'bg-primary-500 text-white shadow-primary-500/20 hover:bg-primary-600' 
                        : 'bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800'
                    }`}>
                    {isTeacher ? 'Manage Protocol' : isStudent && !sub ? 'Engage Mission' : 'Analyze Intent'}
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}


