import api from './axiosInstance';

export const studentApi = {
  getMyCourses: () => api.get('/api/v1/students/me/courses'),
  getMyGrades: () => api.get('/api/v1/students/me/grades'),
  getMyCourseGrades: (courseId: string) => api.get(`/api/v1/students/me/grades/${courseId}`),
  getMyAttendance: (courseId: string) => api.get(`/api/v1/students/me/attendance/${courseId}`),
  getMyStats: () => api.get('/api/v1/students/me/stats'),
  getMyMilestones: () => api.get('/api/v1/students/me/milestones'),
};
