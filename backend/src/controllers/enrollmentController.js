const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student)
exports.enrollCourse = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const enrollment = await Enrollment.create({
    student: req.user.id,
    course: req.params.id,
  });

  res.status(201).json({
    success: true,
    data: enrollment,
  });
});

// @desc    Drop a course
// @route   DELETE /api/courses/:id/enroll
// @access  Private (Student)
exports.dropCourse = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const enrollment = await Enrollment.findOneAndDelete({
    student: req.user.id,
    course: req.params.id,
  });

  if (!enrollment) {
    return res.status(404).json({ success: false, message: 'Enrollment not found' });
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});

const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Submission = require('../models/Submission');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Get my enrolled courses with progress
// @route   GET /api/students/me/courses
// @access  Private (Student)
exports.getMyCourses = asyncHandler(async (req, res, next) => {
  const enrollments = await Enrollment.find({ student: req.user.id }).populate({
    path: 'course',
    populate: { path: 'teacher', select: 'name email' }
  });

  const courseData = await Promise.all(enrollments.map(async (e) => {
    const course = e.course.toObject();
    
    // Calculate progress
    const [totalAssignments, totalQuizzes, submissions, quizAttempts] = await Promise.all([
      Assignment.countDocuments({ course: course._id }),
      Quiz.countDocuments({ course: course._id, isPublished: true }),
      Submission.countDocuments({ course: course._id, student: req.user.id }),
      QuizAttempt.countDocuments({ quiz: { $in: await Quiz.find({ course: course._id }).distinct('_id') }, student: req.user.id })
    ]);

    const totalItems = totalAssignments + totalQuizzes;
    const completedItems = submissions + quizAttempts;
    
    course.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    return course;
  }));

  res.status(200).json({
    success: true,
    count: courseData.length,
    data: courseData,
  });
});
