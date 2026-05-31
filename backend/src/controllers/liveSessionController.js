const LiveSession = require('../models/LiveSession');
const Course = require('../models/Course');
const axios = require('axios');
const Enrollment = require('../models/Enrollment');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Create and schedule a live session
// @route   POST /api/courses/:id/live-sessions
// @access  Private (Teacher)
exports.createLiveSession = async (req, res, next) => {
  const { title, scheduledAt, duration, description } = req.body;

  // Generate a unique Jitsi room ID — no API key needed, works with meet.jit.si
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
  const providerRoomId = `${slug}-${Math.random().toString(36).substr(2, 8)}`;
  const joinUrl = `https://meet.jit.si/${providerRoomId}`;

  const session = await LiveSession.create({
    course: req.params.id,
    teacher: req.user.id,
    title,
    scheduledAt,
    duration,
    description,
    providerRoomId,
    joinUrl
  });

  res.status(201).json({ success: true, data: session });
};

// @desc    Get live sessions for course
// @route   GET /api/courses/:id/live-sessions
// @access  Private
exports.getLiveSessions = async (req, res, next) => {
  const sessions = await LiveSession.find({ course: req.params.id }).sort('-scheduledAt');
  res.status(200).json({ success: true, data: sessions });
};

// @desc    Start live session
// @route   PATCH /api/live-sessions/:id/start
// @access  Private (Teacher)
exports.startSession = async (req, res, next) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

  if (session.teacher.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  session.status = 'live';
  await session.save();

  // Notify all students
  const enrollments = await Enrollment.find({ course: session.course, status: 'active' });
  const notifyPromises = enrollments.map(e => 
    createNotification(
      e.student,
      'live_session',
      session._id,
      `Class is starting now: ${session.title}`
    )
  );
  await Promise.all(notifyPromises);

  res.status(200).json({ success: true, data: session });
};

// @desc    End live session
// @route   PATCH /api/live-sessions/:id/end
// @access  Private (Teacher)
exports.endSession = async (req, res, next) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

  session.status = 'ended';
  await session.save();

  res.status(200).json({ success: true, data: session });
};

// @desc    Get join URL (time-gated)
// @route   GET /api/live-sessions/:id/join
// @access  Private
exports.joinSession = async (req, res, next) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

  // Allow join if session is live OR within 5 minutes of scheduled start
  const now = new Date();
  const earlyAccessTime = new Date(session.scheduledAt.getTime() - 5 * 60 * 1000);
  const canJoin = session.status === 'live' || now >= earlyAccessTime;

  if (!canJoin) {
    return res.status(403).json({ success: false, message: 'Session has not started yet' });
  }

  // If providerRoomId is missing (old sessions), generate one from the joinUrl
  const roomId = session.providerRoomId || session.joinUrl?.split('/').pop() || null;

  res.status(200).json({
    success: true,
    data: {
      joinUrl: session.joinUrl,
      roomId,
      status: session.status,
    }
  });
};
