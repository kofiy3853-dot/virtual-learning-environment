const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Module = require('../models/Module');
const ContentItem = require('../models/ContentItem');
const crypto = require('crypto');

// @desc    Generate a course completion certificate
// @route   POST /api/certificates/generate/:courseId
// @access  Private (Student)
exports.generateCertificate = async (req, res, next) => {
  const courseId = req.params.courseId;
  const studentId = req.user.id;

  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  if (!course.certificateEnabled) {
    return res.status(400).json({ success: false, message: 'Certificates are not enabled for this course' });
  }

  const enrollment = await Enrollment.findOne({ course: courseId, student: studentId });
  if (!enrollment) {
    return res.status(400).json({ success: false, message: 'You are not enrolled in this course' });
  }

  let certificate = await Certificate.findOne({ course: courseId, student: studentId });
  if (certificate) {
    return res.status(200).json({ success: true, data: certificate, message: 'Certificate already issued' });
  }

  // Check progress
  const modules = await Module.find({ course: courseId });
  const moduleIds = modules.map(m => m._id);
  const contentItems = await ContentItem.find({ module: { $in: moduleIds } });

  const totalItems = contentItems.length;
  const completedItems = contentItems.filter(item => item.completedBy && item.completedBy.includes(studentId)).length;

  if (totalItems > 0 && completedItems < totalItems) {
    return res.status(400).json({
      success: false,
      message: `Course not completed yet. Completed ${completedItems}/${totalItems} items.`,
      progress: { completed: completedItems, total: totalItems }
    });
  }

  const certificateId = 'CERT-' + crypto.randomBytes(6).toString('hex').toUpperCase();

  certificate = await Certificate.create({
    student: studentId,
    course: courseId,
    certificateId,
    grade: enrollment.finalGrade || 100
  });

  res.status(201).json({
    success: true,
    data: certificate,
    message: 'Congratulations! Your certificate has been issued successfully!'
  });
};

// @desc    Get a certificate by verification unique ID
// @route   GET /api/certificates/:id
// @access  Public
exports.getCertificate = async (req, res, next) => {
  const certificate = await Certificate.findOne({ certificateId: req.params.id })
    .populate('student', 'name email department')
    .populate('course', 'title code description');

  if (!certificate) {
    return res.status(404).json({ success: false, message: 'Certificate not found' });
  }

  res.status(200).json({
    success: true,
    data: certificate
  });
};

// @desc    Get current user's certificates
// @route   GET /api/certificates/me
// @access  Private (Student)
exports.getMyCertificates = async (req, res, next) => {
  const certificates = await Certificate.find({ student: req.user.id })
    .populate('course', 'title code thumbnail');

  res.status(200).json({
    success: true,
    data: certificates
  });
};
