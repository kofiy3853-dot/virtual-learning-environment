const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const GradeBook = require('../models/GradeBook');
const GradeItem = require('../models/GradeItem');
const mongoose = require('mongoose');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
exports.submitAssignment = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const fileUrls = req.files ? req.files.map(file => file.path) : [];

  const submission = await Submission.create({
    assignment: req.params.id,
    student: req.user.id,
    textContent: req.body.textContent,
    fileUrls: fileUrls,
    status: new Date() > assignment.dueDate ? 'late' : 'submitted'
  });

  res.status(201).json({
    success: true,
    data: submission,
  });
};

// @desc    Get all submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Teacher)
exports.getSubmissions = async (req, res, next) => {
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

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;

  const query = { assignment: req.params.id };
  const total = await Submission.countDocuments(query);
  const submissions = await Submission.find(query).skip(startIndex).limit(limit).populate('student', 'name email');

  res.status(200).json({
    success: true,
    count: submissions.length,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    data: submissions,
  });
};

// @desc    Get my submission for an assignment
// @route   GET /api/assignments/:id/my-submission
// @access  Private (Student)
exports.getMySubmission = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const submission = await Submission.findOne({
    assignment: req.params.id,
    student: req.user.id
  });

  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  res.status(200).json({
    success: true,
    data: submission,
  });
};

// @desc    Grade submission
// @route   PATCH /api/submissions/:id/grade
// @access  Private (Teacher)
exports.gradeSubmission = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  // Populate before update so we have course/teacher for auth check
  const submission = await Submission.findById(req.params.id).populate({
    path: 'assignment',
    populate: { path: 'course' }
  });

  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  if (submission.assignment.course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Apply grade
  submission.grade    = req.body.grade;
  submission.feedback = req.body.feedback || '';
  submission.status   = 'graded';
  await submission.save();

  // Sync to GradeBook
  const assignment = submission.assignment;
  let gradeBook = await GradeBook.findOne({ course: assignment.course._id });
  if (!gradeBook) {
    gradeBook = await GradeBook.create({
      course: assignment.course._id,
      semester: assignment.course.semester,
      academicYear: assignment.course.academicYear
    });
  }

  await GradeItem.findOneAndUpdate(
    { student: submission.student, sourceId: assignment._id },
    {
      gradeBook: gradeBook._id,
      sourceType: 'assignment',
      score: submission.grade,
      maxScore: assignment.totalMarks,
      percentage: (submission.grade / assignment.totalMarks) * 100
    },
    { upsert: true, runValidators: true, new: true }
  );

  // Notify student — use data we already have (no stale reference)
  await createNotification(
    submission.student,
    'grade',
    assignment._id,
    `Your submission for "${assignment.title}" has been graded: ${submission.grade}/${assignment.totalMarks}`
  );

  res.status(200).json({
    success: true,
    data: submission,
  });
};

// @desc    Get all my submissions for a course
// @route   GET /api/courses/:courseId/my-submissions
// @access  Private (Student)
exports.getMyCourseSubmissions = async (req, res, next) => {
  const assignments = await Assignment.find({ course: req.params.courseId });
  const assignmentIds = assignments.map(a => a._id);

  const submissions = await Submission.find({
    student: req.user.id,
    assignment: { $in: assignmentIds }
  });

  res.status(200).json({
    success: true,
    data: submissions
  });
};
