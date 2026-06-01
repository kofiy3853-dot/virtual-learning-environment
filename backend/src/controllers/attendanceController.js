const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');

exports.createSession = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  req.body.course = req.params.id;
  req.body.teacher = req.user.id;
  const session = await AttendanceSession.create(req.body);
  res.status(201).json({ success: true, data: session });
});

exports.markAttendance = asyncHandler(async (req, res) => {
  const { records } = req.body;
  const bulkOps = records.map(record => ({
    updateOne: {
      filter: { session: req.params.sessionId, student: record.studentId },
      update: { status: record.status, markedAt: new Date() },
      upsert: true,
    },
  }));
  await AttendanceRecord.bulkWrite(bulkOps);
  res.status(200).json({ success: true, message: 'Attendance marked successfully' });
});

exports.getSessionRecords = asyncHandler(async (req, res) => {
  const records = await AttendanceRecord.find({ session: req.params.sessionId }).populate('student', 'name email');
  res.status(200).json({ success: true, data: records });
});

exports.getMyAttendance = asyncHandler(async (req, res) => {
  const sessions = await AttendanceSession.find({ course: req.params.courseId });
  const sessionIds = sessions.map(s => s._id);
  const records = await AttendanceRecord.find({
    student: req.user.id,
    session: { $in: sessionIds },
  }).populate('session', 'date topic');
  res.status(200).json({ success: true, data: records });
});

exports.getCourseSessions = asyncHandler(async (req, res) => {
  const sessions = await AttendanceSession.find({ course: req.params.id }).sort('-date');
  res.status(200).json({ success: true, count: sessions.length, data: sessions });
});

exports.getCourseAttendanceSummary = asyncHandler(async (req, res) => {
  const sessions = await AttendanceSession.find({ course: req.params.id });
  const totalSessions = sessions.length;
  if (totalSessions === 0) return res.status(200).json({ success: true, data: [] });

  const summary = await AttendanceRecord.aggregate([
    { $match: { session: { $in: sessions.map(s => s._id) } } },
    {
      $group: {
        _id: '$student',
        presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        lateCount:    { $sum: { $cond: [{ $eq: ['$status', 'late'] },    1, 0] } },
        absentCount:  { $sum: { $cond: [{ $eq: ['$status', 'absent'] },  1, 0] } },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'student' } },
    { $unwind: '$student' },
    {
      $project: {
        'student.name': 1, 'student.email': 1,
        presentCount: 1, lateCount: 1, absentCount: 1,
        attendancePercentage: {
          $multiply: [
            { $divide: [{ $add: ['$presentCount', { $multiply: ['$lateCount', 0.5] }] }, totalSessions] },
            100,
          ],
        },
      },
    },
  ]);

  res.status(200).json({ success: true, data: summary });
});
