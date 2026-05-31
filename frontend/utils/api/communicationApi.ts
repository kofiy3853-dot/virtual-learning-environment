import api from './axiosInstance';

export const communicationApi = {
  // Messages
  getConversations: () => api.get('/api/v1/communication/conversations'),
  getMessages: (userId: string) => api.get(`/api/v1/communication/messages/${userId}`),

  // Notifications
  getMyNotifications: () => api.get('/api/v1/communication/notifications/me'),
  markNotificationRead: (id: string) => api.patch(`/api/v1/communication/notifications/${id}/read`),
  markAllNotificationsRead: () => api.patch('/api/v1/communication/notifications/mark-all-read'),
  deleteNotification: (id: string) => api.delete(`/api/v1/communication/notifications/${id}`),
  deleteAllNotifications: (onlyRead = false) => api.delete(`/api/v1/communication/notifications${onlyRead ? '?onlyRead=true' : ''}`),

  // Announcements (course-scoped)
  getAnnouncements: (courseId: string) => api.get(`/api/v1/courses/${courseId}/announcements`),
  createAnnouncement: (courseId: string, data: { title: string; body: string }) => api.post(`/api/v1/courses/${courseId}/announcements`, data),

  // Discussions (course-scoped)
  getDiscussions: (courseId: string) => api.get(`/api/v1/courses/${courseId}/discussions`),
  startDiscussion: (courseId: string, data: { title: string; body: string }) => api.post(`/api/v1/courses/${courseId}/discussions`, data),
  getDiscussion: (discussionId: string) => api.get(`/api/v1/communication/discussions/${discussionId}`),
  replyDiscussion: (discussionId: string, data: { content: string }) => api.post(`/api/v1/communication/discussions/${discussionId}/reply`, data),
};
