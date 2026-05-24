'use client';

import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/utils/api/courseApi';
import { queryKeys } from '@/lib/queryKeys';
import { Course } from '@/types';
import { AxiosError } from 'axios';

// MongoDB ObjectId is a 24-char hex string
function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

async function fetchCourse(courseId: string): Promise<Course> {
  const res = await courseApi.getOne(courseId);
  return res.data.data;
}

export function useCourse(courseId: string | undefined, enabled = true) {
  const validId = Boolean(courseId) && isValidObjectId(courseId ?? '');

  return useQuery({
    queryKey: queryKeys.courses.detail(courseId ?? ''),
    queryFn: () => fetchCourse(courseId!),
    enabled: validId && enabled,
    retry: (failureCount, error) => {
      // Don't retry on 404 — course genuinely doesn't exist
      if (error instanceof AxiosError && error.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}
