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

// @desc    Get my enrolled courses
// @route   GET /api/students/me/courses
// @access  Private (Student)
exports.getMyCourses = asyncHandler(async (req, res, next) => {
  const enrollments = await Enrollment.find({ student: req.user.id }).populate({
    path: 'course',
    populate: { path: 'teacher', select: 'name email' }
  });

  res.status(200).json({
    success: true,
    count: enrollments.length,
    data: enrollments.map(e => e.course),
  });
});
