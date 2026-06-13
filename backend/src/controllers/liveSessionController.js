const LiveSession = require('../models/LiveSession');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { createNotification } = require('../utils/notificationHelper');
const asyncHandler = require('../middleware/asyncHandler');

exports.createLiveSession = asyncHandler(async (req, res) => {
  const { title, scheduledAt, duration, description } = req.body;

  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
  const providerRoomId = `${slug}-${Math.random().toString(36).substr(2, 8)}`;
  const joinUrl = `https://meet.jit.si/${providerRoomId}`;

  const session = await LiveSession.create({
    course: req.params.id, teacher: req.user.id,
    title, scheduledAt, duration, description, providerRoomId, joinUrl,
  });

  res.status(201).json({ success: true, data: session });
});

exports.getLiveSessions = asyncHandler(async (req, res) => {
  const courseId = req.params.id;

  // If student, only return sessions for courses they're enrolled in
  if (req.user.role === 'student') {
    const enrollment = await Enrollment.findOne({ student: req.user.id, course: courseId, status: 'active' });
    if (!enrollment) {
      return res.status(200).json({ success: true, data: [] });
    }
  }

  const sessions = await LiveSession.find({ course: courseId }).sort('-scheduledAt');
  res.status(200).json({ success: true, data: sessions });
});

exports.startSession = asyncHandler(async (req, res) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  if (session.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  session.status = 'live';
  await session.save();

  const enrollments = await Enrollment.find({ course: session.course, status: 'active' });
  await Promise.all(enrollments.map(e =>
    createNotification(e.student, 'live_session', session._id, `Class is starting now: ${session.title}`)
  ));

  res.status(200).json({ success: true, data: session });
});

exports.endSession = asyncHandler(async (req, res) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
  if (session.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  session.status = 'ended';
  await session.save();
  res.status(200).json({ success: true, data: session });
});

exports.joinSession = asyncHandler(async (req, res) => {
  const session = await LiveSession.findById(req.params.id);
  if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

  // Verify session belongs to the course in URL (mergeParams makes courseId available)
  if (session.course.toString() !== req.params.courseId) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }

  // If student, verify enrollment
  if (req.user.role === 'student') {
    const enrollment = await Enrollment.findOne({ student: req.user.id, course: session.course, status: 'active' });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You must be enrolled in this course to join' });
    }
  }

  const now = new Date();
  const earlyAccessTime = new Date(session.scheduledAt.getTime() - 5 * 60 * 1000);
  const canJoin = session.status === 'live' || now >= earlyAccessTime;

  if (!canJoin) {
    return res.status(403).json({ success: false, message: 'Session has not started yet' });
  }

  const roomId = session.providerRoomId || session.joinUrl?.split('/').pop() || null;
  res.status(200).json({ success: true, data: { joinUrl: session.joinUrl, roomId, status: session.status } });
});
