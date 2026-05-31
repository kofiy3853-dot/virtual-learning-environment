const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Assignment = require('../models/Assignment');
const LiveSession = require('../models/LiveSession');
const Submission = require('../models/Submission');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const GradeBook = require('../models/GradeBook');
const GradeItem = require('../models/GradeItem');
const mongoose = require('mongoose');

// @desc    Get teacher stats
// @route   GET /api/teachers/me/stats
// @access  Private/Teacher
exports.getMyStats = async (req, res, next) => {
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
};

// @desc    Get my courses
// @route   GET /api/teachers/me/courses
// @access  Private/Teacher
exports.getMyCourses = async (req, res, next) => {
  const courses = await Course.find({ teacher: req.user.id })
    .populate('teacher', 'name email')
    .lean();

  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses
  });
};

// @desc    Get pending submissions
// @route   GET /api/teachers/me/pending-submissions
// @access  Private/Teacher
exports.getPendingSubmissions = async (req, res, next) => {
  const courses = await Course.find({ teacher: req.user.id }).select('_id');
  const courseIds = courses.map(c => c._id);

  const assignments = await Assignment.find({ course: { $in: courseIds } }).select('_id');
  const assignmentIds = assignments.map(a => a._id);

  const pendingSubmissions = await Submission.find({
    assignment: { $in: assignmentIds },
    status: { $ne: 'graded' }
  })
    .populate('student', 'name email')
    .populate('assignment', 'title dueDate')
    .lean();

  res.status(200).json({
    success: true,
    count: pendingSubmissions.length,
    data: pendingSubmissions
  });
};

// @desc    Get course gradebook
// @route   GET /api/teachers/me/courses/:courseId/gradebook
// @access  Private/Teacher
exports.getCourseGradebook = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Verify ownership
  if (course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const gradeBook = await GradeBook.findOne({ course: req.params.courseId });
  if (!gradeBook) {
    return res.status(200).json({ success: true, data: { students: [] } });
  }

  const gradeItems = await GradeItem.find({ gradeBook: gradeBook._id })
    .populate('student', 'name email')
    .lean();

  res.status(200).json({
    success: true,
    data: {
      courseId: req.params.courseId,
      students: gradeItems
    }
  });
};

// @desc    Get course analytics
// @route   GET /api/teachers/me/courses/:courseId/analytics
// @access  Private/Teacher
exports.getCourseAnalytics = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Verify ownership
  if (course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const gradeBook = await GradeBook.findOne({ course: req.params.courseId });
  if (!gradeBook) {
    return res.status(200).json({ success: true, data: { message: 'No grades yet' } });
  }

  // Aggregate stats
  const stats = await GradeItem.aggregate([
    { $match: { gradeBook: gradeBook._id } },
    {
      $group: {
        _id: null,
        classAverage: { $avg: '$percentage' },
        highestScore: { $max: '$percentage' },
        lowestScore: { $min: '$percentage' },
      }
    }
  ]);

  // Score distribution
  const distribution = await GradeItem.aggregate([
    { $match: { gradeBook: gradeBook._id } },
    {
      $bucket: {
        groupBy: '$percentage',
        boundaries: [0, 50, 70, 90, 101],
        default: 'Other',
        output: {
          count: { $sum: 1 }
        }
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

  const totalEnrolled = await Enrollment.countDocuments({ course: req.params.courseId });
  const totalGraded = await GradeItem.distinct('student', { gradeBook: gradeBook._id });

  res.status(200).json({
    success: true,
    data: {
      classAverage: stats[0] ? parseFloat(stats[0].classAverage.toFixed(2)) : 0,
      highestScore: stats[0] ? stats[0].highestScore : 0,
      lowestScore: stats[0] ? stats[0].lowestScore : 0,
      distribution: formattedDist,
      completionRate: totalEnrolled > 0 ? parseFloat(((totalGraded.length / totalEnrolled) * 100).toFixed(2)) : 0
    }
  });
};

// @desc    Get at-risk students in course
// @route   GET /api/teachers/me/courses/:courseId/at-risk
// @access  Private/Teacher
exports.getAtRiskStudents = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Verify ownership
  if (course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const gradeBook = await GradeBook.findOne({ course: req.params.courseId });
  if (!gradeBook) {
    return res.status(200).json({ success: true, data: [] });
  }

  const atRisk = await GradeItem.find({
    gradeBook: gradeBook._id,
    percentage: { $lt: 50 }
  }).populate('student', 'name email');

  res.status(200).json({
    success: true,
    data: atRisk
  });
};

// @desc    Get course assignments
// @route   GET /api/teachers/me/courses/:courseId/assignments
// @access  Private/Teacher
exports.getCourseAssignments = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Verify ownership
  if (course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const assignments = await Assignment.find({ course: req.params.courseId })
    .lean();

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments
  });
};

// @desc    Get assignment submissions
// @route   GET /api/teachers/me/assignments/:assignmentId/submissions
// @access  Private/Teacher
exports.getAssignmentSubmissions = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.assignmentId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignment ID' });
  }

  const assignment = await Assignment.findById(req.params.assignmentId).populate('course');
  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  // Verify ownership
  if (assignment.course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const submissions = await Submission.find({ assignment: req.params.assignmentId })
    .populate('student', 'name email')
    .lean();

  res.status(200).json({
    success: true,
    count: submissions.length,
    data: submissions
  });
};

// @desc    Get course quizzes
// @route   GET /api/teachers/me/courses/:courseId/quizzes
// @access  Private/Teacher
exports.getCourseQuizzes = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Verify ownership
  if (course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const quizzes = await Quiz.find({ course: req.params.courseId })
    .lean();

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes
  });
};

// @desc    Get quiz attempts
// @route   GET /api/teachers/me/quizzes/:quizId/attempts
// @access  Private/Teacher
exports.getQuizAttempts = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.quizId)) {
    return res.status(400).json({ success: false, message: 'Invalid quiz ID' });
  }

  const quiz = await Quiz.findById(req.params.quizId).populate('course');
  if (!quiz) {
    return res.status(404).json({ success: false, message: 'Quiz not found' });
  }

  // Verify ownership
  if (quiz.course.teacher.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
    .populate('student', 'name email')
    .lean();

  res.status(200).json({
    success: true,
    count: attempts.length,
    data: attempts
  });
};
