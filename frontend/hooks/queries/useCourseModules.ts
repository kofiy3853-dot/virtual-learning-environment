'use client';

import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/utils/api/courseApi';
import { queryKeys } from '@/lib/queryKeys';

export interface CourseModule {
  _id: string;
  title: string;
  description?: string;
  weekNumber: number;
  order: number;
}

async function fetchModules(courseId: string): Promise<CourseModule[]> {
  const res = await courseApi.getModules(courseId);
  return res.data.data || [];
}

export function useCourseModules(courseId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.modules(courseId ?? ''),
    queryFn: () => fetchModules(courseId!),
    enabled: Boolean(courseId) && enabled,
  });
}
