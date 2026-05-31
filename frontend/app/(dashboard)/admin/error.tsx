'use client';

import RouteError from '@/components/shared/RouteError';

export default function AdminSegmentError({
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
      title="Admin panel unavailable"
      backHref="/dashboard/admin"
      backLabel="Back to Admin Dashboard"
    />
  );
}
