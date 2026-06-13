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
  createdAt?: string;
}

export interface ContentItem {
  _id: string;
  module: string;
  title: string;
  type: 'pdf' | 'video' | 'slide' | 'note' | 'image';
  fileUrl: string;
  order: number;
  createdAt: string;
  completedBy?: string[];
}

export interface CourseOutlineModule {
  week: number;
  title: string;
  topics?: string[];
  learningOutcomes?: string[];
}

export interface CourseOutline {
  modules: CourseOutlineModule[];
}

async function fetchModules(courseId: string): Promise<CourseModule[]> {
  const res = await courseApi.getModules(courseId);
  return res.data.data || [];
}

async function fetchModuleContent(courseId: string, moduleId: string): Promise<ContentItem[]> {
  const res = await courseApi.getModuleContent(courseId, moduleId);
  return res.data.data || [];
}

export function useCourseModules(courseId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.modules(courseId ?? ''),
    queryFn: () => fetchModules(courseId!),
    enabled: Boolean(courseId) && enabled,
  });
}

export function useModuleContent(courseId: string | undefined, moduleId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.moduleContent(moduleId ?? ''),
    queryFn: () => fetchModuleContent(courseId!, moduleId!),
    enabled: Boolean(courseId) && Boolean(moduleId) && enabled,
  });
}

export function useAllModuleContent(courseId: string | undefined, moduleIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.courses.modules(courseId ?? ''), 'content', moduleIds],
    queryFn: async () => {
      const results = await Promise.all(
        moduleIds.map(id => fetchModuleContent(courseId!, id))
      );
      return Object.fromEntries(moduleIds.map((id, i) => [id, results[i]]));
    },
    enabled: Boolean(courseId) && moduleIds.length > 0 && enabled,
  });
}
