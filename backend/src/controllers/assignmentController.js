const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get assignments for a course
// @route   GET /api/courses/:id/assignments
// @access  Private
exports.getAssignments = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const assignments = await Assignment.find({ course: req.params.id });

  res.status(200).json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

// @desc    Create an assignment
// @route   POST /api/courses/:id/assignments
// @access  Private (Teacher)
exports.createAssignment = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  // Check ownership
  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  req.body.course = req.params.id;
  const assignment = await Assignment.create(req.body);

  res.status(201).json({
    success: true,
    data: assignment,
  });
});

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
exports.getAssignment = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const assignment = await Assignment.findById(req.params.id).populate('course', 'title code');

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  res.status(200).json({
    success: true,
    data: assignment,
  });
});

// @desc    Update an assignment
// @route   PUT /api/assignments/:id
// @access  Private (Teacher)
exports.updateAssignment = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  let assignment = await Assignment.findById(req.params.id).populate('course');

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  // Check ownership
  if (assignment.course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: assignment,
  });
});

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher)
exports.deleteAssignment = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const assignment = await Assignment.findById(req.params.id).populate('course');

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  // Check ownership
  if (assignment.course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await assignment.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
