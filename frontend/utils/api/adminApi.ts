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
  getAllUsers:    (params?: UserQueryParams) => api.get('/api/v1/admin/users', { params }),
  updateUser:     (id: string, data: Partial<User>) => api.put(`/api/v1/admin/users/${id}`, data),
  deleteUser:     (id: string) => api.delete(`/api/v1/admin/users/${id}`),
  changeStatus:   (id: string, status: User['status']) => api.patch(`/api/v1/admin/users/${id}/status`, { status }),
  changeRole:     (id: string, role: User['role']) => api.patch(`/api/v1/admin/users/${id}/role`, { role }),
  impersonate:    (id: string) => api.post<{ success: boolean; impersonationToken: string }>(`/api/v1/admin/users/${id}/impersonate`),
  exitImpersonation: () => api.post<{ success: boolean; token: string }>('/api/v1/admin/impersonate/exit'),
  
  // Platform Analytics
  getStats:       () => api.get('/api/v1/admin/stats'),
  getOverview:    () => api.get('/api/v1/admin/analytics/overview'),
  getGradeAnalytics:     () => api.get('/api/v1/admin/analytics/grades'),
  getUserAnalytics:      () => api.get('/api/v1/admin/analytics/users'),
  getAttendanceAnalytics:() => api.get('/api/v1/admin/analytics/attendance'),
  getEnrollmentTrends:   () => api.get('/api/v1/admin/analytics/enrollment-trends'),
  getLogs:        (params?: LogQueryParams) => api.get('/api/v1/admin/logs', { params }),
  
  // Course Management (Admin level)
  getAllCourses:  (params?: { search?: string; status?: string; page?: number; limit?: number }) => api.get('/api/v1/admin/courses', { params }),
  approveCourse:  (id: string) => api.patch(`/api/v1/admin/courses/${id}/approve`),
  changeCourseStatus: (id: string, status: Course['status']) => api.patch(`/api/v1/admin/courses/${id}/status`, { status }),
  deleteCourse:   (id: string) => api.delete(`/api/v1/admin/courses/${id}`),
  reassignTeacher:(id: string, teacherId: string) => api.patch(`/api/v1/admin/courses/${id}/teacher`, { teacherId }),
};
