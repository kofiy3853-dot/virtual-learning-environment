'use client';

import Sidebar from '@/components/shared/Sidebar';
import CourseWizard from '@/components/builder/CourseWizard';

export default function NewCoursePage() {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <CourseWizard />
      </main>
    </div>
  );
}
