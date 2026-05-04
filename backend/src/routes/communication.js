const express = require('express');
const {
  createAnnouncement,
  getAnnouncements,
  startDiscussion,
  getDiscussions,
  getDiscussion,
  replyDiscussion,
  getMessages,
  getMyNotifications,
  markRead,
} = require('../controllers/communicationController');

const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');

// Announcements (Course level)
router.post('/announcements', protect, createAnnouncement);
router.get('/announcements', protect, getAnnouncements);

// Discussions (Course level)
router.route('/discussions')
  .get(protect, getDiscussions)
  .post(protect, startDiscussion);

// Single discussion thread + replies
router.get('/discussions/:id', protect, getDiscussion);
router.post('/discussions/:id/reply', protect, replyDiscussion);

// Messages (Global)
router.get('/messages/:userId', protect, getMessages);

// Notifications (Global)
router.get('/notifications/me', protect, getMyNotifications);
router.patch('/notifications/:id/read', protect, markRead);

module.exports = router;
