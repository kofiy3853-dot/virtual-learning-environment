const Announcement = require('../models/Announcement');
const Discussion = require('../models/Discussion');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('express-async-handler');

// @desc    Create announcement
// @route   POST /api/courses/:id/announcements
// @access  Private (Teacher)
exports.createAnnouncement = asyncHandler(async (req, res, next) => {
  req.body.course = req.params.id;
  req.body.author = req.user.id;
  const announcement = await Announcement.create(req.body);

  // Notify all students in course
  const enrollments = await Enrollment.find({ course: req.params.id });
  const notifications = enrollments.map(e => ({
    user: e.student,
    type: 'announcement',
    referenceId: announcement._id,
    message: `New announcement in course: ${announcement.title}`
  }));
  await Notification.insertMany(notifications);

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

// @desc    Get messages with user
// @route   GET /api/messages/:userId
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find({
    $or: [
      { sender: req.user.id, receiver: req.params.userId },
      { sender: req.params.userId, receiver: req.user.id }
    ]
  }).sort('createdAt');

  res.status(200).json({ success: true, data: messages });
});

// @desc    Get my notifications
// @route   GET /api/notifications/me
// @access  Private
exports.getMyNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user.id }).sort('-createdAt');
  res.status(200).json({ success: true, data: notifications });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markRead = asyncHandler(async (req, res, next) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.status(200).json({ success: true });
});
