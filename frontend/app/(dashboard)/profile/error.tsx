'use client';

import RouteError from '@/components/shared/RouteError';

export default function ProfileSegmentError({
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
      title="Profile page unavailable"
      backHref="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
