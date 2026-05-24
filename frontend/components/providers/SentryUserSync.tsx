'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { setSentryUser, clearSentryUser } from '@/lib/sentry';

export function SentryUserSync() {
  const { user } = useAuth();

  useEffect(() => {
    // Set user context when authenticated
    if (user?._id) {
      setSentryUser(user._id, user.email, user.name);
    } else {
      clearSentryUser();
    }
  }, [user]);

  return null;
}
