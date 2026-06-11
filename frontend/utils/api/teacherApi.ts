import api from './axiosInstance';

export const teacherApi = {
  // Stats and courses
  getStats: () => api.get('/api/v1/teachers/me/stats'),
  getMyCourses: () => api.get('/api/v1/teachers/me/courses'),
  getPendingSubmissions: () => api.get('/api/v1/teachers/me/pending-submissions'),

  // Course-specific endpoints
  getCourseGradebook: (courseId: string) => api.get(`/api/v1/teachers/me/courses/${courseId}/gradebook`),
  getCourseAnalytics: (courseId: string) => api.get(`/api/v1/teachers/me/courses/${courseId}/analytics`),
  getAtRiskStudents: (courseId: string) => api.get(`/api/v1/teachers/me/courses/${courseId}/at-risk`),
  getCourseAssignments: (courseId: string) => api.get(`/api/v1/teachers/me/courses/${courseId}/assignments`),
  getCourseQuizzes: (courseId: string) => api.get(`/api/v1/teachers/me/courses/${courseId}/quizzes`),

  // Assignment and quiz submissions
  getAssignmentSubmissions: (assignmentId: string) => api.get(`/api/v1/teachers/me/assignments/${assignmentId}/submissions`),
  getQuizAttempts: (quizId: string) => api.get(`/api/v1/teachers/me/quizzes/${quizId}/attempts`),

  // Question history
  getMyQuestions: () => api.get('/api/v1/teachers/me/questions'),
};
