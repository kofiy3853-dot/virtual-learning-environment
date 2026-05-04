const ContentItem = require('../models/ContentItem');
const Module = require('../models/Module');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Add content to module
// @route   POST /api/modules/:id/content
// @access  Private (Teacher)
exports.addContent = asyncHandler(async (req, res, next) => {
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

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }

  const content = await ContentItem.create({
    module: req.params.id,
    title: req.body.title || req.file.originalname,
    type: req.body.type,
    fileUrl: req.file.path,
    order: req.body.order,
  });

  res.status(201).json({
    success: true,
    data: content,
  });
});

// @desc    Get content for module
// @route   GET /api/modules/:id/content
// @access  Private
exports.getModuleContent = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const content = await ContentItem.find({ module: req.params.id }).sort('order');

  res.status(200).json({
    success: true,
    count: content.length,
    data: content,
  });
});

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private (Teacher)
exports.deleteContent = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const content = await ContentItem.findById(req.params.id).populate({
    path: 'module',
    populate: { path: 'course' }
  });

  if (!content) {
    return res.status(404).json({ success: false, message: 'Content not found' });
  }

  // Check ownership
  if (content.module.course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  await content.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
