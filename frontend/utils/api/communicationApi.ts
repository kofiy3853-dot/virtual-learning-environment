import api from './axiosInstance';

export const communicationApi = {
  // Messages
  getConversations: () => api.get('/api/communication/conversations'),
  getMessages: (userId: string) => api.get(`/api/communication/messages/${userId}`),

  // Notifications
  getMyNotifications: () => api.get('/api/communication/notifications/me'),
  markNotificationRead: (id: string) => api.patch(`/api/communication/notifications/${id}/read`),

  // Announcements (course-scoped)
  getAnnouncements: (courseId: string) => api.get(`/api/courses/${courseId}/announcements`),
  createAnnouncement: (courseId: string, data: any) => api.post(`/api/courses/${courseId}/announcements`, data),

  // Discussions (course-scoped)
  getDiscussions: (courseId: string) => api.get(`/api/courses/${courseId}/discussions`),
  startDiscussion: (courseId: string, data: any) => api.post(`/api/courses/${courseId}/discussions`, data),
  getDiscussion: (discussionId: string) => api.get(`/api/communication/discussions/${discussionId}`),
  replyDiscussion: (discussionId: string, data: any) => api.post(`/api/communication/discussions/${discussionId}/reply`, data),
};
