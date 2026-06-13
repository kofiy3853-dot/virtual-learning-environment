const ContentItem = require('../models/ContentItem');
const Module = require('../models/Module');
const mongoose = require('mongoose');

// @desc    Add content to module
// @route   POST /api/modules/:id/content
// @access  Private (Teacher)
exports.addContent = async (req, res, next) => {
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
};

// @desc    Get content for module
// @route   GET /api/modules/:id/content
// @access  Private
exports.getModuleContent = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const content = await ContentItem.find({ module: req.params.id }).sort('order');

  res.status(200).json({
    success: true,
    count: content.length,
    data: content,
  });
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private (Teacher)
exports.deleteContent = async (req, res, next) => {
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
};

// @desc    Get single content item
// @route   GET /api/content/:id
// @access  Private
exports.getContent = async (req, res, next) => {
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

  res.status(200).json({
    success: true,
    data: content,
  });
};

// @desc    Toggle completion status of content item for current student
// @route   POST /api/content/:id/complete
// @access  Private (Student)
exports.toggleContentComplete = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const content = await ContentItem.findById(req.params.id);

  if (!content) {
    return res.status(404).json({ success: false, message: 'Content item not found' });
  }

  const studentId = req.user.id;
  const isCompleted = content.completedBy && content.completedBy.includes(studentId);

  if (isCompleted) {
    content.completedBy = content.completedBy.filter(id => id.toString() !== studentId);
  } else {
    if (!content.completedBy) {
      content.completedBy = [];
    }
    content.completedBy.push(studentId);
  }

  await content.save();

  res.status(200).json({
    success: true,
    data: content,
    isCompleted: !isCompleted
  });
};
