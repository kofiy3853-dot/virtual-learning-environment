'use client';

import CourseWizard from '@/components/builder/CourseWizard';
import { Suspense } from 'react';

export default function NewCoursePage() {
  return (
    <div className="-mx-6 -my-6 lg:-mx-12 lg:-my-12">
      <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading builder...</div>}>
        <CourseWizard />
      </Suspense>
    </div>
  );
}
