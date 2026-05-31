'use client';

import RouteError from '@/components/shared/RouteError';

export default function MessagesSegmentError({
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
      title="Messaging hub unavailable"
      backHref="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
