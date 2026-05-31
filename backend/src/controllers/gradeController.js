const GradeWeight = require('../models/GradeWeight');
const GradeBook = require('../models/GradeBook');
const GradeItem = require('../models/GradeItem');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const { calculateFinalGrade } = require('../utils/gradeCalculator');

// @desc    Set grade weights for a course
// @route   POST /api/courses/:id/grade-weights
// @access  Private (Teacher)
exports.setGradeWeights = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const weight = await GradeWeight.findOneAndUpdate(
    { course: req.params.id },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: weight,
  });
};

// @desc    Get grade weights for a course
// @route   GET /api/courses/:id/grade-weights
// @access  Private
exports.getGradeWeights = async (req, res, next) => {
  const weights = await GradeWeight.findOne({ course: req.params.id });

  res.status(200).json({
    success: true,
    data: weights || { assignmentWeight: 60, quizWeight: 40 },
  });
};

// @desc    Get full course gradebook
// @route   GET /api/courses/:id/gradebook
// @access  Private (Teacher)
exports.getGradeBook = async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const gradeBook = await GradeBook.findOne({ course: req.params.id });
  if (!gradeBook) {
    return res.status(200).json({ success: true, data: [] });
  }

  const gradeItems = await GradeItem.find({ gradeBook: gradeBook._id }).populate('student', 'name email');

  res.status(200).json({
    success: true,
    data: gradeItems,
  });
};

// @desc    Get my grades (student)
// @route   GET /api/students/me/grades
// @access  Private (Student)
exports.getMyGrades = async (req, res, next) => {
  const gradeItems = await GradeItem.find({ student: req.user.id }).populate({
    path: 'gradeBook',
    populate: { path: 'course', select: 'title code' }
  });

  res.status(200).json({
    success: true,
    data: gradeItems,
  });
};

// @desc    Get my grades for a single course
// @route   GET /api/students/me/grades/:courseId
// @access  Private (Student)
exports.getMyCourseGrades = async (req, res, next) => {
  const gradeBook = await GradeBook.findOne({ course: req.params.courseId });

  // FIX: Don't 404 on a fresh course — return empty state with 200
  if (!gradeBook) {
    return res.status(200).json({
      success: true,
      data: { items: [], finalPercentage: 0, assignmentAverage: 0, quizAverage: 0 }
    });
  }

  const gradeItems = await GradeItem.find({ 
    student: req.user.id,
    gradeBook: gradeBook._id 
  });

  const weights = await GradeWeight.findOne({ course: req.params.courseId }) || { assignmentWeight: 60, quizWeight: 40 };

  const finalGrade = calculateFinalGrade(gradeItems, weights);

  res.status(200).json({
    success: true,
    data: {
      items: gradeItems,
      ...finalGrade
    },
  });
};
