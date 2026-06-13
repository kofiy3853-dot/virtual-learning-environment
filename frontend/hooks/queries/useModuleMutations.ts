'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '@/utils/api/courseApi';
import { queryKeys } from '@/lib/queryKeys';
import { ContentItem } from './useCourseModules';
import toast from 'react-hot-toast';

interface UploadContentParams {
  courseId: string;
  moduleId: string;
  data: FormData;
}

export function useUploadContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, moduleId, data }: UploadContentParams) =>
      courseApi.uploadContent(courseId, moduleId, data),
    onSuccess: (res, { courseId, moduleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.moduleContent(moduleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.modules(courseId) });
      toast.success('Course material uploaded successfully.');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to upload material.');
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) => courseApi.deleteContent(contentId),
    onSuccess: (_data, contentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.moduleContent(contentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
      toast.success('Resource deleted.');
    },
    onError: () => {
      toast.error('Failed to delete resource.');
    },
  });
}

export function useToggleContentComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contentId: string) => courseApi.toggleContentComplete(contentId),
    onMutate: async (contentId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.moduleContent(contentId) });

      const previousContent = queryClient.getQueryData<ContentItem[]>(queryKeys.courses.moduleContent(contentId));

      queryClient.setQueryData<ContentItem[]>(queryKeys.courses.moduleContent(contentId), (old) => {
        if (!old) return old;
        return old.map(item => {
          if (item._id === contentId) {
            const isCompleted = item.completedBy?.includes('current-user') ?? false;
            return {
              ...item,
              completedBy: isCompleted
                ? item.completedBy!.filter(id => id !== 'current-user')
                : [...(item.completedBy || []), 'current-user'],
            };
          }
          return item;
        });
      });

      return { previousContent };
    },
    onSuccess: (res, contentId) => {
      queryClient.setQueryData<ContentItem[]>(queryKeys.courses.moduleContent(contentId), (old) => {
        if (!old) return old;
        return old.map(item => {
          if (item._id === contentId && res.data) {
            return res.data;
          }
          return item;
        });
      });
    },
    onError: (_err, _contentId, context) => {
      if (context?.previousContent) {
        queryClient.setQueryData(queryKeys.courses.moduleContent(_contentId), context.previousContent);
      }
      toast.error('Failed to update progress.');
    },
    onSettled: (_data, _err, contentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.moduleContent(contentId) });
    },
  });
}

interface UpdateModuleParams {
  courseId: string;
  moduleId: string;
  data: Partial<{ title: string; description: string; weekNumber: number; order: number }>;
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, moduleId, data }: UpdateModuleParams) =>
      courseApi.updateModule(moduleId, data),
    onSuccess: (_, { courseId, moduleId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.modules(courseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.moduleContent(moduleId) });
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update module.');
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: { title: string; description: string; weekNumber: number; order: number } }) =>
      courseApi.createModule(courseId, data),
    onSuccess: (_, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.modules(courseId) });
      toast.success('Syllabus module created successfully.');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create module.');
    },
  });
}