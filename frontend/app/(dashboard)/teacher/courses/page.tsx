'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { teacherApi } from '@/utils/api/teacherApi';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  BookOpen, Users, BarChart3, AlertTriangle, ArrowRight,
  Search, Plus, Eye, Settings
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Course {
  _id: string;
  title: string;
  code: string;
  studentCount?: number;
  createdAt: string;
  status: string;
  description?: string;
}

export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'students' | 'recent'>('name');

  const { data: courses = [], isLoading } = useQuery({
    queryKey: queryKeys.teacher.courses(user?._id || ''),
    queryFn: () => teacherApi.getMyCourses(),
    select: (res) => res.data?.data ?? [],
    enabled: !!user,
  });

  const filteredCourses = courses
    .filter((c: Course) => {
      const searchLower = search.toLowerCase();
      const titleMatch = (c.title || '').toLowerCase().includes(searchLower);
      const codeMatch = (c.code || '').toLowerCase().includes(searchLower);
      return titleMatch || codeMatch;
    })
    .sort((a: Course, b: Course) => {
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'students') return (b.studentCount || 0) - (a.studentCount || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">My Courses</h1>
          <p className="text-slate-500 mt-1">Manage and monitor all your courses</p>
        </div>
        <Link href="/courses/new" className="btn btn-primary gap-2 self-start sm:self-auto">
          <Plus size={16} />
          New Course
        </Link>
      </header>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses..."
            className="input-premium pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Sort courses by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'students' | 'recent')}
            className="input-premium"
          >
            <option value="name">Sort by Name</option>
            <option value="students">Sort by Students</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl">
          <BookOpen size={40} className="mx-auto text-slate-200 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No courses found</h3>
          <p className="text-slate-500 mb-4">Create your first course to get started</p>
          <Link href="/courses/new" className="btn btn-primary">
            Create Course
          </Link>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl">
          <Search size={40} className="mx-auto text-slate-200 mb-3" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No results found</h3>
          <p className="text-slate-500">No courses match your search "{search}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course: Course, idx: number) => (
            <motion.div
              key={course._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all"
            >
              {/* Header */}
              <div className="h-28 bg-gradient-to-br from-primary-500 to-primary-600 relative p-4 flex items-end">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{course.code}</p>
                  <h3 className="text-lg font-bold text-white mt-1 line-clamp-2">{course.title}</h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <BookOpen size={18} className="text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-500 font-medium">Students</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{course.studentCount || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-500 font-medium">Status</p>
                    <p className="text-sm font-bold text-primary-600 mt-1 capitalize">{course.status}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 line-clamp-2">
                  {course.description || 'No description provided'}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/courses/${course._id}`}
                    className="flex-1 btn btn-secondary btn-sm gap-1"
                  >
                    <Eye size={14} />
                    View
                  </Link>
                  <Link
                    href={`/courses/${course._id}/settings`}
                    className="btn btn-ghost btn-sm gap-1"
                  >
                    <Settings size={14} />
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
