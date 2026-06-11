const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  const total = await Course.countDocuments();
  const courses = await Course.find().skip(startIndex).limit(limit).populate('teacher', 'name email');

  res.status(200).json({
    success: true,
    count: courses.length,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: courses,
  });
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
exports.getCourse = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const course = await Course.findById(req.params.id).populate('teacher', 'name email');

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  res.status(200).json({
    success: true,
    data: course,
  });
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Teacher)
exports.createCourse = async (req, res, next) => {
  const { validateFacultyDepartment } = require('../middleware/validation');
  
  // Validate faculty/department combination if provided
  if (req.body.faculty && req.body.department) {
    const validation = validateFacultyDepartment(req.body.faculty, req.body.department);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }
  }
  
  // Add user to req.body if not specified by admin
  if (req.user.role !== 'admin' || !req.body.teacher) {
    req.body.teacher = req.user.id;
  }

  try {
    const course = await Course.create(req.body);
    return res.status(201).json({ success: true, data: course });
  } catch (error) {
    // Duplicate code error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.code) {
      return res.status(400).json({ success: false, message: 'A course with this code already exists.' });
    }
    // Validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: 'Validation error', details: messages });
    }
    // Unexpected errors
    logger.error('[COURSE] Create error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Teacher Owner)
exports.updateCourse = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  let course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Make sure user is course owner
  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `User ${req.user.id} is not authorized to update this course`,
    });
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: course,
  });
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Teacher Owner / Admin)
exports.deleteCourse = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Make sure user is course owner
  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `User ${req.user.id} is not authorized to delete this course`,
    });
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc    Check if a course code is available
// @route   GET /api/courses/check-code?code=CS101
// @access  Private
exports.checkCode = async (req, res) => {
  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'code query param is required' });
  }
  const exists = await Course.exists({ code: { $regex: new RegExp(`^${code.trim()}$`, 'i') } });
  res.status(200).json({ success: true, data: { available: !exists } });
};


// @route   GET /api/courses/:id/students
// @access  Private (Teacher)
exports.getCourseStudents = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const enrollments = await Enrollment.find({ course: req.params.id }).populate('student', 'name email department');

  res.status(200).json({
    success: true,
    count: enrollments.length,
    data: enrollments.map(e => e.student),
  });
};

// @desc    Enroll multiple students in course
// @route   POST /api/courses/:id/students
// @access  Private (Teacher/Admin)
exports.enrollStudents = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const { studentIds } = req.body;
  if (!Array.isArray(studentIds)) {
    return res.status(400).json({ success: false, message: 'studentIds must be an array' });
  }

  const enrollments = [];
  for (const studentId of studentIds) {
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      const enrollment = await Enrollment.findOneAndUpdate(
        { student: studentId, course: req.params.id },
        { status: 'active' },
        { upsert: true, new: true }
      );
      enrollments.push(enrollment);
    }
  }

  res.status(200).json({
    success: true,
    count: enrollments.length,
    data: enrollments
  });
};

