'use client';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/hooks/queries/useCourse';
import {
  Home, BookOpen, FileText, FlaskConical, BarChart3,
  CheckSquare, MessageSquare, Bell, Video, ChevronRight,
  Loader2, GraduationCap, Settings as SettingsIcon, Sparkles, Users
} from 'lucide-react';

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const courseId = params.courseId as string;
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: course, isLoading, isError } = useCourse(courseId);

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const isOwner =
    isAdmin ||
    (isTeacher &&
      ((typeof course?.teacher === 'object' && course.teacher?._id === user?._id) ||
        course?.teacher === user?._id));

  const tabs = [
    { label: 'Overview',      href: `/courses/${courseId}`,              icon: Home },
    { label: 'Modules',       href: `/courses/${courseId}/modules`,       icon: BookOpen },
    { label: 'Assignments',   href: `/courses/${courseId}/assignments`,   icon: FileText },
    { label: 'Quizzes',       href: `/courses/${courseId}/quizzes`,       icon: FlaskConical },
    { label: 'Grades',        href: `/courses/${courseId}/grades`,        icon: BarChart3 },
    { label: 'Attendance',    href: `/courses/${courseId}/attendance`,    icon: CheckSquare },
    { label: 'Discussions',   href: `/courses/${courseId}/discussions`,   icon: MessageSquare },
    { label: 'Announcements', href: `/courses/${courseId}/announcements`, icon: Bell },
    { label: 'Live',          href: `/courses/${courseId}/live`,          icon: Video },
    ...(isOwner ? [{ label: 'Students', href: `/courses/${courseId}/students`, icon: Users }] : []),
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-sm text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <div className="text-center bg-white border border-slate-200 rounded-2xl p-10 max-w-sm shadow-sm">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100 text-red-500">
            <GraduationCap size={20} />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">Course not found</h2>
          <p className="text-sm text-slate-500 mb-2 leading-relaxed">
            This course doesn&apos;t exist, has been archived, or you may not have access to it.
          </p>
          {courseId && (
            <p className="text-xs text-slate-400 font-mono mb-5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
              ID: {courseId}
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary btn-sm"
            >
              Retry
            </button>
            <Link href="/courses" className="btn btn-primary btn-sm">
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Course Header */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
        {/* Breadcrumb + meta row */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Link href="/courses" className="hover:text-primary-600 transition-colors font-medium">Courses</Link>
              <ChevronRight size={11} />
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-primary-50 text-primary-700 text-[11px] font-semibold">
              {course.code}
            </span>
            <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
              course.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {course.status}
            </span>
            {course.semester && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
                <Sparkles size={10} className="text-amber-400" />
                {course.semester} · {course.academicYear}
              </span>
            )}
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/courses/${courseId}/students`}
                className="btn btn-secondary btn-sm gap-1 shrink-0"
              >
                <Users size={12} /> Students
              </Link>
              <Link
                href={`/courses/${courseId}/settings`}
                className="btn btn-secondary btn-sm gap-1 shrink-0"
              >
                <SettingsIcon size={12} /> Settings
              </Link>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-[17px] font-semibold text-slate-900 tracking-tight leading-snug mb-3">
          {course.title}
        </h1>

        {/* Compact Tab Bar */}
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar -mb-4 pb-0 border-t border-slate-100 pt-3">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href ||
              (tab.href !== `/courses/${courseId}` && pathname.startsWith(tab.href));
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors rounded-md ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
