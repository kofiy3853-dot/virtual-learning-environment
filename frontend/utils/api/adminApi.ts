import { User, Course } from '@/types';
import api from './axiosInstance';

export interface UserQueryParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface LogQueryParams {
  search?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  // User Management
  getAllUsers:    (params?: UserQueryParams) => api.get('/api/admin/users', { params }),
  updateUser:     (id: string, data: Partial<User>) => api.put(`/api/admin/users/${id}`, data),
  deleteUser:     (id: string) => api.delete(`/api/admin/users/${id}`),
  changeStatus:   (id: string, status: User['status']) => api.patch(`/api/admin/users/${id}/status`, { status }),
  changeRole:     (id: string, role: User['role']) => api.patch(`/api/admin/users/${id}/role`, { role }),
  impersonate:    (id: string) => api.post<{ success: boolean; impersonationToken: string }>(`/api/admin/users/${id}/impersonate`),
  exitImpersonation: () => api.post<{ success: boolean; token: string }>('/api/admin/impersonate/exit'),
  
  // Platform Analytics
  getStats:       () => api.get('/api/admin/stats'),
  getOverview:    () => api.get('/api/admin/analytics/overview'),
  getGradeAnalytics:     () => api.get('/api/admin/analytics/grades'),
  getUserAnalytics:      () => api.get('/api/admin/analytics/users'),
  getAttendanceAnalytics:() => api.get('/api/admin/analytics/attendance'),
  getEnrollmentTrends:   () => api.get('/api/admin/analytics/enrollment-trends'),
  getLogs:        (params?: LogQueryParams) => api.get('/api/admin/logs', { params }),
  
  // Course Management (Admin level)
  getAllCourses:  (params?: { search?: string; status?: string; page?: number; limit?: number }) => api.get('/api/admin/courses', { params }),
  approveCourse:  (id: string) => api.patch(`/api/admin/courses/${id}/approve`),
  changeCourseStatus: (id: string, status: Course['status']) => api.patch(`/api/admin/courses/${id}/status`, { status }),
  deleteCourse:   (id: string) => api.delete(`/api/admin/courses/${id}`),
  reassignTeacher:(id: string, teacherId: string) => api.patch(`/api/admin/courses/${id}/teacher`, { teacherId }),
};
