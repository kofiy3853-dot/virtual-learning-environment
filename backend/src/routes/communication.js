const {
  createAnnouncement,
  getAnnouncements,
  startDiscussion,
  getDiscussions,
  getDiscussion,
  replyDiscussion,
  getMessages,
  getConversations,
  getMyNotifications,
  markRead,
} = require('../controllers/communicationController');

const express = require('express');

const router = express.Router({ mergeParams: true });

const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Announcements (Course level)
router.post('/announcements', protect, validate(schemas.createAnnouncement), createAnnouncement);
router.get('/announcements', protect, getAnnouncements);

// Discussions (Course level)
router.route('/discussions')
  .get(protect, getDiscussions)
  .post(protect, validate(schemas.createDiscussion), startDiscussion);

// Single discussion thread + replies
router.get('/discussions/:id', protect, getDiscussion);
router.post('/discussions/:id/reply', protect, validate(schemas.replyDiscussion), replyDiscussion);

// Messages (Global)
router.get('/conversations', protect, getConversations);
router.get('/messages/:userId', protect, getMessages);

// Notifications (Global)
router.get('/notifications/me', protect, getMyNotifications);
router.patch('/notifications/:id/read', protect, markRead);

module.exports = router;
