const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const LiveSession = require('../models/LiveSession');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const GradeItem = require('../models/GradeItem');
const asyncHandler = require('express-async-handler');

// @desc    Get all upcoming milestones for the student
// @route   GET /api/students/me/milestones
// @access  Private/Student
exports.getMyMilestones = asyncHandler(async (req, res, next) => {
  // 1. Get student's enrolled courses
  const enrollments = await Enrollment.find({ student: req.user.id }).select('course');
  const courseIds = enrollments.map(e => e.course);

  if (!courseIds.length) {
    return res.status(200).json({ success: true, data: [] });
  }

  // 2. Fetch all milestones from relevant models
  const [assignments, quizzes, liveSessions] = await Promise.all([
    Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title color')
      .lean(),
    Quiz.find({ course: { $in: courseIds }, isPublished: true })
      .populate('course', 'title color')
      .lean(),
    LiveSession.find({ course: { $in: courseIds } })
      .populate('course', 'title color')
      .lean()
  ]);

  // 3. Normalize into a unified Milestone interface
  const milestones = [
    ...assignments.map(a => ({
      id: a._id,
      title: a.title,
      type: 'assignment',
      deadline: a.dueDate,
      course: a.course,
      priority: new Date(a.dueDate) < new Date(Date.now() + 48 * 3600000) ? 'high' : 'medium'
    })),
    ...quizzes.map(q => ({
      id: q._id,
      title: q.title,
      type: 'quiz',
      deadline: q.startTime,
      course: q.course,
      priority: new Date(q.startTime) < new Date(Date.now() + 48 * 3600000) ? 'high' : 'medium'
    })),
    ...liveSessions.map(ls => ({
      id: ls._id,
      title: ls.title,
      type: 'live_session',
      deadline: ls.startTime,
      course: ls.course,
      priority: new Date(ls.startTime) < new Date(Date.now() + 24 * 3600000) ? 'high' : 'low'
    }))
  ];

  // 4. Sort by temporal proximity
  milestones.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  res.status(200).json({
    success: true,
    count: milestones.length,
    data: milestones
  });
});

// @desc    Get student overall stats
// @route   GET /api/students/me/stats
// @access  Private/Student
exports.getMyStats = asyncHandler(async (req, res, next) => {
  const enrollments = await Enrollment.find({ student: req.user.id }).select('course');
  const courseIds = enrollments.map(e => e.course);

  if (!courseIds.length) {
    return res.status(200).json({
      success: true,
      data: { overallCompletion: 0, assignmentsSubmitted: 0 }
    });
  }

  const [assignmentsSubmitted, totalCourses, grades] = await Promise.all([
    Submission.countDocuments({ student: req.user.id }),
    Enrollment.countDocuments({ student: req.user.id, status: 'active' }),
    GradeItem.find({ student: req.user.id })
  ]);
  
  let overallCompletion = 0;
  let gpa = 0;
  
  if (grades.length > 0) {
     const sum = grades.reduce((acc, g) => acc + g.percentage, 0);
     overallCompletion = Math.round(sum / grades.length);
     // Simple GPA calculation: (percentage / 100) * 4.0
     gpa = parseFloat(((overallCompletion / 100) * 4).toFixed(1));
  }
  
  res.status(200).json({
    success: true,
    data: {
      overallCompletion,
      assignmentsSubmitted,
      totalCourses,
      gpa: gpa || 0.0,
      studyHours: Math.floor(assignmentsSubmitted * 1.5) + 5, // Estimated based on activity
      onTimeRate: 98 // Placeholder for now until we track late status more strictly
    }
  });
});
