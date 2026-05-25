'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { courseApi } from '@/utils/api/courseApi';
import type { Course } from '@/types';
import { useCourse } from '@/hooks/queries/useCourse';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/context/AuthContext';
import {
  Settings, Save, Trash2, Loader2, Globe, Lock, Archive,
  CheckCircle2, AlertTriangle, BookOpen, Tag, Calendar,
  FileText, BarChart3, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const statusOptions = [
  {
    value: 'active' as const,
    label: 'Active',
    description: 'Visible and accessible to all enrolled students.',
    icon: Globe,
    activeRing: 'ring-2 ring-emerald-200 border-emerald-400',
    iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    dot: 'bg-emerald-500',
  },
  {
    value: 'draft' as const,
    label: 'Draft',
    description: 'Hidden from students. Only you can see it.',
    icon: Lock,
    activeRing: 'ring-2 ring-amber-200 border-amber-400',
    iconColor: 'bg-amber-50 text-amber-600 border-amber-100',
    dot: 'bg-amber-500',
  },
  {
    value: 'archived' as const,
    label: 'Archived',
    description: 'Read-only. No new submissions or activity.',
    icon: Archive,
    activeRing: 'ring-2 ring-slate-200 border-slate-400',
    iconColor: 'bg-slate-50 text-slate-600 border-slate-100',
    dot: 'bg-slate-400',
  },
];

export default function CourseSettingsPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useCourse(courseId);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<Partial<Course>>({
    title: '', code: '', description: '',
    semester: 'Semester 1', academicYear: '2025/2026', status: 'active',
  });

  useEffect(() => {
    if (!course) return;
    const teacherId = typeof course.teacher === 'object' ? course.teacher?._id : course.teacher;
    if (teacherId !== user?._id && user?.role !== 'admin') {
      router.push(`/courses/${courseId}`);
      return;
    }
    setForm({
      title: course.title || '',
      code: course.code || '',
      description: course.description || '',
      semester: course.semester || 'Semester 1',
      academicYear: course.academicYear || '2025/2026',
      status: course.status || 'active',
    });
  }, [course, courseId, user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await courseApi.update(courseId, form);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
      toast.success('Course updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently delete "${course?.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await courseApi.delete(courseId);
      toast.success('Course deleted');
      router.push('/courses');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete course');
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 size={28} className="animate-spin text-primary-600" />
      </div>
    );
  }

  const currentStatus = statusOptions.find(o => o.value === form.status) || statusOptions[0];

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary-600 font-bold text-[10px] uppercase tracking-widest">
              <Settings size={14} /> Course Settings
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{course?.title}</h2>
            <p className="text-slate-500 font-medium text-sm">Manage course details, visibility, and access.</p>
          </div>
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border self-start md:self-auto ${
            form.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            form.status === 'draft' ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
            {form.status?.charAt(0).toUpperCase()}{form.status?.slice(1)}
          </span>
        </div>
      </motion.section>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-6">

          {/* Core Details */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5"
          >
            <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <BookOpen size={13} /> Course Details
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course Title</label>
                <input
                  required
                  placeholder="e.g. Introduction to Data Science"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <Tag size={11} className="inline mr-1" />Course Code
                </label>
                <input
                  required
                  placeholder="e.g. CS101"
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <Calendar size={11} className="inline mr-1" />Semester
                </label>
                <select
                  value={form.semester}
                  onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all bg-white"
                >
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Summer Session</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Academic Year</label>
                <input
                  placeholder="e.g. 2025/2026"
                  value={form.academicYear}
                  onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <FileText size={11} className="inline mr-1" />Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe what students will learn in this course..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm resize-none transition-all"
                />
              </div>
            </div>
          </motion.div>

          {/* Visibility */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5"
          >
            <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <BarChart3 size={13} /> Visibility
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {statusOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = form.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, status: opt.value }))}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                      isSelected ? opt.activeRing + ' bg-white' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${opt.iconColor}`}>
                      <Icon size={16} />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.description}</p>
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 size={16} className="text-primary-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4"
          >
            <p className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Shield size={13} /> Course Info
            </p>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Course ID', value: courseId.slice(-8), mono: true },
                { label: 'Code', value: form.code || '—' },
                { label: 'Semester', value: form.semester || '—' },
                { label: 'Year', value: form.academicYear || '—' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-slate-500">{item.label}</span>
                  <span className={`font-semibold text-slate-900 ${item.mono ? 'font-mono text-xs bg-slate-50 px-2 py-1 rounded-lg border border-slate-100' : ''}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-rose-50 rounded-3xl border border-rose-200 p-6 space-y-4"
          >
            <p className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest">
              <AlertTriangle size={13} /> Danger Zone
            </p>
            <p className="text-sm text-rose-800/70 leading-relaxed">
              Deleting this course is permanent. All modules, assignments, submissions, and grades will be lost.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-rose-200 text-rose-600 font-bold text-sm hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              {deleting ? 'Deleting...' : 'Delete Course'}
            </button>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
