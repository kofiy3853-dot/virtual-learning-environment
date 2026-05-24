'use client';
import { useState } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { teacherApi } from '@/utils/api/teacherApi';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  FileText, User, Calendar, AlertCircle, CheckCircle2,
  ArrowRight, Search, Filter, Clock, Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function TeacherSubmissionsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'graded'>('pending');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['teacher', 'pending-submissions'],
    queryFn: () => teacherApi.getPendingSubmissions(),
    select: (res) => res.data?.data ?? [],
    enabled: !!user,
  });

  const filteredSubmissions = submissions
    .filter((s: any) => {
      const matchesSearch = 
        s.student?.name.toLowerCase().includes(search.toLowerCase()) ||
        s.assignment?.title.toLowerCase().includes(search.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'pending') return matchesSearch && s.status !== 'graded';
      return matchesSearch && s.status === 'graded';
    });

  const pendingCount = submissions.filter((s: any) => s.status !== 'graded').length;
  const gradedCount = submissions.filter((s: any) => s.status === 'graded').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Submissions</h1>
          <p className="text-slate-500 mt-1">Review and grade student submissions</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: submissions.length, icon: FileText, color: 'blue' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: pendingCount > 0 ? 'amber' : 'slate' },
          { label: 'Graded', value: gradedCount, icon: CheckCircle2, color: 'emerald' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${
            color === 'blue' ? 'bg-blue-50 border-blue-100' :
            color === 'amber' ? 'bg-amber-50 border-amber-100' :
            color === 'emerald' ? 'bg-emerald-50 border-emerald-100' :
            'bg-slate-50 border-slate-100'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wider ${
                  color === 'blue' ? 'text-blue-600' :
                  color === 'amber' ? 'text-amber-600' :
                  color === 'emerald' ? 'text-emerald-600' :
                  'text-slate-600'
                }`}>{label}</p>
                <p className="text-2xl font-black mt-1">{value}</p>
              </div>
              <Icon size={24} className={
                color === 'blue' ? 'text-blue-200' :
                color === 'amber' ? 'text-amber-200' :
                color === 'emerald' ? 'text-emerald-200' :
                'text-slate-200'
              } />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student or assignment..."
            className="input-premium pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'graded'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filterStatus === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl">
          <FileText size={40} className="mx-auto text-slate-200 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No submissions found</h3>
          <p className="text-slate-500">Check back when students submit their work</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSubmissions.map((submission: any, idx: number) => (
            <motion.div
              key={submission._id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md hover:border-slate-200 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <User size={16} className="text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {submission.student?.name}
                      </p>
                      <p className="text-xs text-slate-500">{submission.student?.email}</p>
                    </div>
                  </div>
                  <div className="ml-10">
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {submission.assignment?.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                  {submission.status === 'graded' ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-600">Graded</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                      <AlertCircle size={14} className="text-amber-600" />
                      <span className="text-xs font-semibold text-amber-600">Pending</span>
                    </div>
                  )}
                  <Link
                    href={`/teacher/submissions/${submission._id}`}
                    className="btn btn-secondary btn-sm gap-1"
                  >
                    Review <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
