const Module = require('../models/Module');
const Course = require('../models/Course');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Get all modules for a course
// @route   GET /api/courses/:id/modules
// @access  Private
exports.getModules = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const modules = await Module.find({ course: req.params.id }).sort('order');

  res.status(200).json({
    success: true,
    count: modules.length,
    data: modules,
  });
});

// @desc    Create a module
// @route   POST /api/courses/:id/modules
// @access  Private (Teacher)
exports.createModule = asyncHandler(async (req, res, next) => {
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
  const module = await Module.create(req.body);

  res.status(201).json({
    success: true,
    data: module,
  });
});

// @desc    Update a module
// @route   PUT /api/modules/:id
// @access  Private (Teacher)
exports.updateModule = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  let module = await Module.findById(req.params.id).populate('course');

  if (!module) {
    return res.status(404).json({ success: false, message: 'Module not found' });
  }

  // Check ownership
  if (module.course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  module = await Module.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: module,
  });
});

// @desc    Delete a module
// @route   DELETE /api/modules/:id
// @access  Private (Teacher)
exports.deleteModule = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const module = await Module.findById(req.params.id).populate('course');

  if (!module) {
    return res.status(404).json({ success: false, message: 'Module not found' });
  }

  // Check ownership
  if (module.course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await module.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
