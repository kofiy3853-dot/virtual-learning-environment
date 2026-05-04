const GradeItem = require('../models/GradeItem');
const GradeBook = require('../models/GradeBook');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get course analytics
// @route   GET /api/courses/:id/analytics
// @access  Private (Teacher)
exports.getCourseAnalytics = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const gradeBook = await GradeBook.findOne({ course: req.params.id });
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

  const totalEnrolled = await Enrollment.countDocuments({ course: req.params.id });
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
});

// @desc    Get at-risk students
// @route   GET /api/courses/:id/analytics/at-risk
// @access  Private (Teacher)
exports.getAtRiskStudents = asyncHandler(async (req, res, next) => {
  const gradeBook = await GradeBook.findOne({ course: req.params.id });
  if (!gradeBook) {
    return res.status(200).json({ success: true, data: [] });
  }

  const atRisk = await GradeItem.find({
    gradeBook: gradeBook._id,
    percentage: { $lt: 50 }
  }).populate('student', 'name email');

  res.status(200).json({
    success: true,
    data: atRisk,
  });
});

// @desc    Platform wide analytics (Admin)
// @route   GET /api/admin/analytics/overview
// @access  Private (Admin)
exports.getPlatformOverview = asyncHandler(async (req, res, next) => {
  const stats = await GradeItem.aggregate([
    {
      $group: {
        _id: null,
        passRate: {
          $avg: { $cond: [{ $gte: ['$percentage', 50] }, 1, 0] }
        },
        avgScore: { $avg: '$percentage' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      passRate: stats[0] ? parseFloat((stats[0].passRate * 100).toFixed(2)) : 0,
      averageScore: stats[0] ? parseFloat(stats[0].avgScore.toFixed(2)) : 0
    }
  });
});
