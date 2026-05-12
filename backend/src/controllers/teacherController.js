const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Assignment = require('../models/Assignment');
const LiveSession = require('../models/LiveSession');
const asyncHandler = require('express-async-handler');

// @desc    Get teacher stats
// @route   GET /api/teachers/me/stats
// @access  Private/Teacher
exports.getMyStats = asyncHandler(async (req, res, next) => {
  const courses = await Course.find({ teacher: req.user.id }).select('_id');
  const courseIds = courses.map(c => c._id);

  if (!courseIds.length) {
    return res.status(200).json({
      success: true,
      data: { students: 0, attendance: 0, engagementData: [0,0,0,0,0,0,0], upcomingClasses: [] }
    });
  }

  // Active Students: sum of enrollments
  const studentsCount = await Enrollment.countDocuments({ course: { $in: courseIds } });

  // Avg Attendance:
  const sessions = await AttendanceSession.find({ course: { $in: courseIds } }).select('_id');
  const sessionIds = sessions.map(s => s._id);

  const [totalRecords, presentRecords] = await Promise.all([
    AttendanceRecord.countDocuments({ session: { $in: sessionIds } }),
    AttendanceRecord.countDocuments({ session: { $in: sessionIds }, status: { $in: ['present', 'late'] } })
  ]);

  const avgAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

  // Mock engagement data for now (to avoid complex timeseries queries for Phase 1)
  const engagementData = [40, 65, 45, 80, 55, 90, 75];

  // Upcoming Classes / Events
  const [assignments, liveSessions] = await Promise.all([
    Assignment.find({ course: { $in: courseIds }, dueDate: { $gt: new Date() } }).populate('course', 'title').lean(),
    LiveSession.find({ course: { $in: courseIds }, startTime: { $gt: new Date() } }).populate('course', 'title').lean()
  ]);

  const upcomingClasses = [
    ...liveSessions.map(ls => ({ title: ls.title, time: ls.startTime, type: 'Live Class', color: 'bg-blue-500' })),
    ...assignments.map(a => ({ title: a.title, time: a.dueDate, type: 'Assignment', color: 'bg-amber-500' }))
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).slice(0, 3);

  res.status(200).json({
    success: true,
    data: {
      students: studentsCount,
      attendance: avgAttendance,
      engagementData,
      upcomingClasses
    }
  });
});
