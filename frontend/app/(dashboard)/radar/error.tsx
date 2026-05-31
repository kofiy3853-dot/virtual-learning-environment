'use client';

import RouteError from '@/components/shared/RouteError';

export default function RadarSegmentError({
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
      title="RADAR Analytics currently unavailable"
      backHref="/dashboard/student"
      backLabel="Back to Student Dashboard"
    />
  );
}
