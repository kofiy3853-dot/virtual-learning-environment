const express = require('express');
const {
  createAnnouncement,
  getAnnouncements,
  startDiscussion,
  replyDiscussion,
  getMessages,
  getMyNotifications,
  markRead,
} = require('../controllers/communicationController');

const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');

// Note: This router will be mounted at different points
// Announcements & Discussions (Course level)
router.post('/announcements', protect, createAnnouncement);
router.get('/announcements', protect, getAnnouncements);
router.post('/discussions', protect, startDiscussion);

// Replies
router.post('/discussions/:id/reply', protect, replyDiscussion);

// Messages
router.get('/messages/:userId', protect, getMessages);

// Notifications
router.get('/notifications/me', protect, getMyNotifications);
router.patch('/notifications/:id/read', protect, markRead);

module.exports = router;
