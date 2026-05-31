'use client';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/hooks/queries/useCourse';
import CourseAIPanel from '@/components/ai/CourseAIPanel';
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
      {/* Course Header */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        {/* Thumbnail strip */}
        <div className="h-20 relative">
          {(course as { thumbnail?: string }).thumbnail && !(course as { thumbnail?: string }).thumbnail?.includes('no-course-thumbnail') ? (
            <img
              src={(course as { thumbnail?: string }).thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Course code on the banner */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[11px] font-bold">
              {course.code}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold backdrop-blur-sm border ${
              course.status === 'active'
                ? 'bg-emerald-500/80 text-white border-emerald-400/50'
                : 'bg-slate-500/80 text-white border-slate-400/50'
            }`}>
              {course.status}
            </span>
            {course.semester && (
              <span className="hidden sm:flex items-center gap-1 text-[11px] text-white/70 font-medium">
                <Sparkles size={10} className="text-amber-300" />
                {course.semester} · {course.academicYear}
              </span>
            )}
          </div>
          {isOwner && (
            <div className="absolute bottom-2 right-3 flex items-center gap-1.5">
              <Link
                href={`/courses/${courseId}/students`}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold border border-white/20 hover:bg-white/30 transition-colors"
              >
                <Users size={11} /> Students
              </Link>
              <Link
                href={`/courses/${courseId}/settings`}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold border border-white/20 hover:bg-white/30 transition-colors"
              >
                <SettingsIcon size={11} /> Settings
              </Link>
            </div>
          )}
        </div>

        {/* Title + Tab Bar */}
        <div className="px-4 pt-3 pb-0">
          <h1 className="text-[17px] font-semibold text-slate-900 tracking-tight leading-snug mb-3">
            {course.title}
          </h1>

          {/* Compact Tab Bar */}
          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar border-t border-slate-100 pt-2">
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

      {/* Contextual AI panel — teachers & admins only */}
      {isOwner && (
        <CourseAIPanel
          courseTitle={course.title}
          defaultMode={
            pathname.includes('/quizzes') ? 'quiz' :
            pathname.includes('/assignments') ? 'assignment' :
            pathname.includes('/modules') ? 'lecture' :
            pathname.includes('/discussions') ? 'feedback' :
            'quiz'
          }
        />
      )}
    </div>
  );
}
