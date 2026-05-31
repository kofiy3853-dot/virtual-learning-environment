const Announcement = require('../models/Announcement');
const Discussion = require('../models/Discussion');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('express-async-handler');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Create announcement
// @route   POST /api/courses/:id/announcements
// @access  Private (Teacher)
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  req.body.course = req.params.id;
  req.body.author = req.user.id;
  const announcement = await Announcement.create(req.body);

  // Notify all students in course
  const enrollments = await Enrollment.find({ course: req.params.id, status: 'active' });
  
  const notifyPromises = enrollments.map(e => 
    createNotification(
      e.student,
      'announcement',
      announcement._id,
      `New announcement: ${announcement.title}`
    )
  );
  await Promise.all(notifyPromises);

  res.status(201).json({ success: true, data: announcement });
});

// @desc    Get announcements
// @route   GET /api/courses/:id/announcements
// @access  Private
exports.getAnnouncements = asyncHandler(async (req, res, next) => {
  const announcements = await Announcement.find({ course: req.params.id }).sort('-createdAt');
  res.status(200).json({ success: true, data: announcements });
});

// @desc    Start discussion
// @route   POST /api/courses/:id/discussions
// @access  Private
exports.startDiscussion = asyncHandler(async (req, res, next) => {
  req.body.course = req.params.id;
  req.body.author = req.user.id;
  const discussion = await Discussion.create(req.body);
  res.status(201).json({ success: true, data: discussion });
});

// @desc    Get all discussions for a course
// @route   GET /api/courses/:id/discussions
// @access  Private
exports.getDiscussions = asyncHandler(async (req, res, next) => {
  const discussions = await Discussion.find({ course: req.params.id })
    .populate('author', 'name avatar')
    .populate('replies.author', 'name avatar')
    .sort('-createdAt');
  res.status(200).json({ success: true, count: discussions.length, data: discussions });
});

// @desc    Get single discussion thread
// @route   GET /api/discussions/:id
// @access  Private
exports.getDiscussion = asyncHandler(async (req, res, next) => {
  const discussion = await Discussion.findById(req.params.id)
    .populate('author', 'name avatar')
    .populate('replies.author', 'name avatar');
  if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });
  res.status(200).json({ success: true, data: discussion });
});

// @desc    Reply to discussion
// @route   POST /api/discussions/:id/reply
// @access  Private
exports.replyDiscussion = asyncHandler(async (req, res, next) => {
  const discussion = await Discussion.findById(req.params.id);
  if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });

  discussion.replies.push({
    author: req.user.id,
    body: req.body.body
  });
  await discussion.save();

  res.status(200).json({ success: true, data: discussion });
});

// @desc    Get all my conversations (unique users I have messaged)
// @route   GET /api/communication/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id }
        ]
      }
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", req.user._id] },
            "$receiver",
            "$sender"
          ]
        },
        lastMessage: { $first: "$body" },
        createdAt: { $first: "$createdAt" },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$receiver", req.user._id] }, { $eq: ["$isRead", false] }] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        lastMessage: 1,
        createdAt: 1,
        unreadCount: 1,
        'user.name': 1,
        'user.avatar': 1,
        'user.role': 1,
        'user.online': { $literal: false } // Placeholder for real-time presence
      }
    },
    { $sort: { createdAt: -1 } }
  ]);

  res.status(200).json({ success: true, count: conversations.length, data: conversations });
});

// @desc    Get messages with user
// @route   GET /api/communication/messages/:userId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: req.params.userId },
      { sender: req.params.userId, receiver: req.user.id }
    ]
  }).sort('createdAt');

  // Mark as read
  await Message.updateMany(
    { sender: req.params.userId, receiver: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ success: true, data: messages });
});

// @desc    Get my notifications
// @route   GET /api/communication/notifications/me
// @access  Private
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const notifications = await Notification.find({ user: req.user.id })
    .sort('-createdAt')
    .limit(limit);
  res.status(200).json({ success: true, data: notifications });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markRead = asyncHandler(async (req, res, next) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.status(200).json({ success: true });
});

// @desc    Get course group messages
// @route   GET /api/communication/courses/:courseId/messages
// @access  Private
exports.getCourseMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({ course: req.params.courseId })
    .populate('sender', 'name avatar role')
    .sort('createdAt');

  res.status(200).json({ success: true, data: messages });
});

// @desc    Mark ALL notifications as read
// @route   PATCH /api/communication/notifications/mark-all-read
// @access  Private
exports.markAllRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete a single notification
// @route   DELETE /api/communication/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  await notification.deleteOne();
  res.status(200).json({ success: true, message: 'Notification deleted' });
});

// @desc    Delete ALL notifications for current user
// @route   DELETE /api/communication/notifications
// @access  Private
exports.deleteAllNotifications = asyncHandler(async (req, res, next) => {
  const { onlyRead } = req.query; // ?onlyRead=true clears only read ones
  const filter = { user: req.user.id };
  if (onlyRead === 'true') filter.isRead = true;

  const result = await Notification.deleteMany(filter);
  res.status(200).json({ success: true, message: `${result.deletedCount} notification(s) deleted` });
});
