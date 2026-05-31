'use client';

import RouteError from '@/components/shared/RouteError';

export default function TeacherSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="Teacher panel unavailable"
      backHref="/dashboard/teacher"
      backLabel="Back to Teacher Dashboard"
    />
  );
}
