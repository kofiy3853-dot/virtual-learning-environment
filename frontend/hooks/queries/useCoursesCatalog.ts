'use client';

import { useQuery } from '@tanstack/react-query';
import { courseApi } from '@/utils/api/courseApi';
import { queryKeys } from '@/lib/queryKeys';
import { Course } from '@/types';

export function useEnrolledCourseIds(enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.enrolled,
    queryFn: async () => {
      const res = await courseApi.getMyCourses();
      const courses: Course[] = res.data.data || [];
      return new Set(courses.map((c) => c._id));
    },
    enabled,
  });
}

export function useCoursesCatalog(
  params: { search?: string; status?: string; page?: number },
  options: { teacherId?: string; isTeacher?: boolean; enabled?: boolean } = {}
) {
  const { teacherId, isTeacher, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: async () => {
      const res = await courseApi.getAll(params);
      let all: Course[] = res.data.data || [];
      if (isTeacher && teacherId) {
        all = all.filter((c) => {
          const tId = typeof c.teacher === 'object' ? c.teacher?._id : c.teacher;
          return tId === teacherId;
        });
      }
      return {
        data: all,
        pagination: res.data.pagination || null
      };
    },
    enabled,
  });
}
