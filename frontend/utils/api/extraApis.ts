import api from './axiosInstance';
import { Quiz, Question, LiveSession } from '@/types';

export const quizApi = {
  getQuizzes: (courseId: string) => api.get(`/api/v1/courses/${courseId}/quizzes`),
  createQuiz: (courseId: string, data: Partial<Quiz>) => api.post(`/api/v1/courses/${courseId}/quizzes`, data),
  getQuiz: (quizId: string) => api.get(`/api/v1/quizzes/${quizId}`),
  updateQuiz: (quizId: string, data: Partial<Quiz>) => api.put(`/api/v1/quizzes/${quizId}`, data),
  deleteQuiz: (quizId: string) => api.delete(`/api/v1/quizzes/${quizId}`),
  publishQuiz: (quizId: string) => api.patch(`/api/v1/quizzes/${quizId}/publish`),
  // Questions
  getQuestions: (quizId: string) => api.get(`/api/v1/quizzes/${quizId}/questions`),
  addQuestion: (quizId: string, data: Partial<Question>) => api.post(`/api/v1/quizzes/${quizId}/questions`, data),
  updateQuestion: (questionId: string, data: Partial<Question>) => api.put(`/api/v1/questions/${questionId}`, data),
  deleteQuestion: (questionId: string) => api.delete(`/api/v1/questions/${questionId}`),
  // Attempts
  startAttempt: (quizId: string) => api.post(`/api/v1/quizzes/${quizId}/start`),
  submitAttempt: (quizId: string, data: { answers: Record<string, string> | Array<{ questionId: string; answer: string }> }) =>
    api.post(`/api/v1/quizzes/${quizId}/submit`, data),
  getMyAttempt: (quizId: string) => api.get(`/api/v1/quizzes/${quizId}/my-attempt`),
  getAllAttempts: (quizId: string) => api.get(`/api/v1/quizzes/${quizId}/attempts`),
  gradeAttempt: (attemptId: string, data: { scoreAdjustment: number; feedback?: string }) => api.patch(`/api/v1/attempts/${attemptId}/grade`, data),
  resetAttempt: (quizId: string, studentId: string) => api.delete(`/api/v1/quizzes/${quizId}/attempts/${studentId}`),
  // Bulk question upload
  bulkAddQuestions: (quizId: string, questions: unknown[]) => api.post(`/api/v1/quizzes/${quizId}/questions/bulk`, { questions }),
};
