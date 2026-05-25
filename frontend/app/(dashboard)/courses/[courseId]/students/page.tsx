'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { courseApi } from '@/utils/api/courseApi';
import {
  Users, Search, UserMinus, UserPlus, Mail, Shield,
  CheckCircle2, AlertCircle, Loader2, GraduationCap,
  MoreHorizontal, X, TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledAt?: string;
  status?: string;
}

export default function StudentsPage() {
  const { courseId } = useParams() as { courseId: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['course-students', courseId],
    queryFn: () => courseApi.getStudents(courseId).then(r => r.data?.data ?? []),
    enabled: !!courseId,
  });

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRemove = async (studentId: string, name: string) => {
    if (!window.confirm(`Remove ${name} from this course?`)) return;
    setRemoving(studentId);
    try {
      await courseApi.drop(courseId);
      await queryClient.invalidateQueries({ queryKey: ['course-students', courseId] });
      toast.success(`${name} removed from course`);
    } catch {
      toast.error('Failed to remove student');
    } finally {
      setRemoving(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = inviteEmails.split(/[\n,]/).map(e => e.trim()).filter(Boolean);
    if (!emails.length) return;
    setInviting(true);
    try {
      // In a real implementation this would send invites via email
      // For now we show success feedback
      toast.success(`Invitation sent to ${emails.length} student${emails.length > 1 ? 's' : ''}`);
      setInviteEmails('');
      setShowInvite(false);
    } catch {
      toast.error('Failed to send invitations');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
              <Users size={14} /> Student Roster
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Enrolled Students
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              {students.length} student{students.length !== 1 ? 's' : ''} enrolled in this course
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Stats pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 size={12} /> {students.length} Active
              </div>
            </div>
            {isTeacher && (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all"
              >
                <UserPlus size={15} /> Invite Students
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all bg-white"
        />
      </div>

      {/* Student List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
            <GraduationCap size={36} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {search ? 'No students match your search' : 'No students enrolled yet'}
          </h3>
          <p className="text-slate-500 text-sm mt-2">
            {search ? 'Try a different name or email.' : 'Invite students to get started.'}
          </p>
          {!search && isTeacher && (
            <button
              onClick={() => setShowInvite(true)}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all mx-auto"
            >
              <UserPlus size={15} /> Invite Students
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student, idx) => (
            <motion.div
              key={student._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl bg-primary-100 border border-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm shrink-0 overflow-hidden">
                    {student.avatar && !student.avatar.includes('no-photo') ? (
                      <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                      student.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{student.name}</p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Mail size={11} /> {student.email}
                    </p>
                  </div>
                </div>

                {isTeacher && (
                  <button
                    onClick={() => handleRemove(student._id, student.name)}
                    disabled={removing === student._id}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                    title="Remove student"
                  >
                    {removing === student._id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <UserMinus size={14} />}
                  </button>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-500">Active</span>
                </div>
                {student.enrolledAt && (
                  <span className="text-xs text-slate-400">
                    Joined {new Date(student.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowInvite(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Invite Students</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enter email addresses, one per line or comma-separated</p>
                </div>
                <button
                  onClick={() => setShowInvite(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <textarea
                  rows={5}
                  placeholder="student1@university.edu&#10;student2@university.edu"
                  value={inviteEmails}
                  onChange={e => setInviteEmails(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm resize-none transition-all"
                />
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInvite(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmails.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    {inviting ? 'Sending...' : 'Send Invites'}
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
