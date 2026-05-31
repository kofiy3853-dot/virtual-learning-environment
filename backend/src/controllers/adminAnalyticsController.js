const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const QuizAttempt = require('../models/QuizAttempt');
const GradeItem = require('../models/GradeItem');
const AttendanceRecord = require('../models/AttendanceRecord');
const AdminLog = require('../models/AdminLog');

// @desc    High-level platform snapshot
// @route   GET /api/admin/analytics/overview
// @access  Private (Admin)
exports.getOverview = async (req, res, next) => {
  const [
    totalUsers,
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalCourses,
    activeCourses,
    totalEnrollments,
    totalSubmissions,
    totalQuizAttempts
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'admin' }),
    Course.countDocuments(),
    Course.countDocuments({ status: 'active' }),
    Enrollment.countDocuments(),
    Submission.countDocuments(),
    QuizAttempt.countDocuments()
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalCourses,
      activeCourses,
      totalEnrollments,
      totalSubmissions,
      totalQuizAttempts
    }
  });
};

// @desc    User registration growth
// @route   GET /api/admin/analytics/users
// @access  Private (Admin)
exports.getUserAnalytics = async (req, res, next) => {
  const users = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        students: { $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] } },
        teachers: { $sum: { $cond: [{ $eq: ['$role', 'teacher'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.status(200).json({ success: true, data: users });
};

// @desc    Platform-wide grade distribution
// @route   GET /api/admin/analytics/grades
// @access  Private (Admin)
exports.getGradeAnalytics = async (req, res, next) => {
  const stats = await GradeItem.aggregate([
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$percentage' },
        passRate: { $avg: { $cond: [{ $gte: ['$percentage', 50] }, 1, 0] } }
      }
    }
  ]);

  const distribution = await GradeItem.aggregate([
    {
      $bucket: {
        groupBy: '$percentage',
        boundaries: [0, 50, 70, 90, 101],
        default: 'Other',
        output: { count: { $sum: 1 } }
      }
    }
  ]);

  const formattedDist = {
    'below50': 0,
    '50-69': 0,
    '70-89': 0,
    '90-100': 0
  };

  distribution.forEach(d => {
    if (d._id === 0) formattedDist['below50'] = d.count;
    else if (d._id === 50) formattedDist['50-69'] = d.count;
    else if (d._id === 70) formattedDist['70-89'] = d.count;
    else if (d._id === 90) formattedDist['90-100'] = d.count;
  });

  const passRate = stats[0] ? stats[0].passRate * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      platformAverage: stats[0] ? parseFloat(stats[0].avgScore.toFixed(1)) : 0,
      distribution: formattedDist,
      passRate: parseFloat(passRate.toFixed(1)),
      failRate: parseFloat((100 - passRate).toFixed(1))
    }
  });
};

// @desc    Attendance rates across all courses
// @route   GET /api/admin/analytics/attendance
// @access  Private (Admin)
exports.getAttendanceAnalytics = async (req, res, next) => {
  const breakdown = await AttendanceRecord.aggregate([
    {
      $lookup: {
        from: 'attendancesessions',
        localField: 'session',
        foreignField: '_id',
        as: 'sessionInfo'
      }
    },
    { $unwind: '$sessionInfo' },
    {
      $group: {
        _id: '$sessionInfo.course',
        presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        totalCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    {
      $project: {
        courseId: '$_id',
        courseTitle: '$course.title',
        attendanceRate: { $multiply: [{ $divide: ['$presentCount', '$totalCount'] }, 100] }
      }
    }
  ]);

  const platformRate = breakdown.length > 0 
    ? breakdown.reduce((acc, b) => acc + b.attendanceRate, 0) / breakdown.length 
    : 0;

  res.status(200).json({
    success: true,
    data: {
      platformAttendanceRate: parseFloat(platformRate.toFixed(1)),
      courseBreakdown: breakdown
    }
  });
};

// @desc    Recent platform actions for admin monitoring
// @route   GET /api/admin/analytics/activity-logs
// @access  Private (Admin)
exports.getActivityLogs = async (req, res, next) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const logs = await AdminLog.find().sort('-createdAt').limit(limit).populate('adminId', 'name email');
  res.status(200).json({ success: true, data: logs });
};

// @desc    Enrollment count grouped by semester and academic year
// @route   GET /api/admin/analytics/enrollment-trends
// @access  Private (Admin)
exports.getEnrollmentTrends = async (req, res, next) => {
  const trends = await Enrollment.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseInfo'
      }
    },
    { $unwind: '$courseInfo' },
    {
      $group: {
        _id: {
          semester: '$courseInfo.semester',
          academicYear: '$courseInfo.academicYear'
        },
        enrollmentCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.academicYear': 1, '_id.semester': 1 } }
  ]);

  res.status(200).json({ success: true, data: trends });
};

// @desc    Course analytics — status breakdown and enrollment stats
// @route   GET /api/admin/analytics/courses
// @access  Private (Admin)
exports.getCourseAnalytics = async (req, res, next) => {
  const [totalCourses, activeCourses, archivedCourses, draftCourses] = await Promise.all([
    Course.countDocuments(),
    Course.countDocuments({ status: 'active' }),
    Course.countDocuments({ status: 'archived' }),
    Course.countDocuments({ status: 'draft' })
  ]);

  // Average enrollment per active course
  const enrollmentStats = await Enrollment.aggregate([
    {
      $group: {
        _id: '$course',
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        avgEnrollment: { $avg: '$count' },
        maxEnrollment: { $max: '$count' },
        minEnrollment: { $min: '$count' }
      }
    }
  ]);

  // Top 5 most enrolled courses
  const topCourses = await Enrollment.aggregate([
    { $group: { _id: '$course', enrollmentCount: { $sum: 1 } } },
    { $sort: { enrollmentCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    {
      $project: {
        courseId: '$_id',
        courseTitle: '$course.title',
        courseCode: '$course.code',
        enrollmentCount: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalCourses,
      activeCourses,
      archivedCourses,
      draftCourses,
      avgEnrollment: enrollmentStats[0] ? parseFloat(enrollmentStats[0].avgEnrollment.toFixed(1)) : 0,
      maxEnrollment: enrollmentStats[0] ? enrollmentStats[0].maxEnrollment : 0,
      topCourses
    }
  });
};
