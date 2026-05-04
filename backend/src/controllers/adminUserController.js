const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Module = require('../models/Module');
const ContentItem = require('../models/ContentItem');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const GradeBook = require('../models/GradeBook');
const GradeItem = require('../models/GradeItem');
const GradeWeight = require('../models/GradeWeight');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Announcement = require('../models/Announcement');
const Discussion = require('../models/Discussion');
const LiveSession = require('../models/LiveSession');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const logAdminAction = require('../utils/logAdminAction');

/**
 * Shared cascade logic for course deletion.
 * Extracted as a helper so both deleteUser (teacher cleanup) and deleteCourse can reuse it.
 */
const cascadeDeleteCourse = async (courseId) => {
  const [assignments, gradeBooks, quizzes, sessions] = await Promise.all([
    Assignment.find({ course: courseId }),
    GradeBook.find({ course: courseId }),
    Quiz.find({ course: courseId }),
    AttendanceSession.find({ course: courseId })
  ]);

  const assignmentIds = assignments.map(a => a._id);
  const gradeBookIds = gradeBooks.map(g => g._id);
  const quizIds = quizzes.map(q => q._id);
  const sessionIds = sessions.map(s => s._id);

  await Promise.all([
    Module.deleteMany({ course: courseId }),
    ContentItem.deleteMany({ course: courseId }),
    Assignment.deleteMany({ course: courseId }),
    Submission.deleteMany({ assignment: { $in: assignmentIds } }),
    Enrollment.deleteMany({ course: courseId }),
    GradeBook.deleteMany({ course: courseId }),
    GradeItem.deleteMany({ gradeBook: { $in: gradeBookIds } }),
    GradeWeight.deleteMany({ course: courseId }),
    Quiz.deleteMany({ course: courseId }),
    Question.deleteMany({ quiz: { $in: quizIds } }),
    QuizAttempt.deleteMany({ quiz: { $in: quizIds } }),
    AttendanceSession.deleteMany({ course: courseId }),
    AttendanceRecord.deleteMany({ session: { $in: sessionIds } }),
    Announcement.deleteMany({ course: courseId }),
    Discussion.deleteMany({ course: courseId }),
    LiveSession.deleteMany({ course: courseId }),
    Course.findByIdAndDelete(courseId)
  ]);
};

// @desc    List all users with filters and pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = asyncHandler(async (req, res, next) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const query = {};

  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const count = await User.countDocuments(query);
  const users = await User.find(query).skip(skip).limit(Number(limit)).sort('-createdAt');

  res.status(200).json({
    success: true,
    count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
    data: users
  });
});

// @desc    Get full user profile
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUser = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.status(200).json({ success: true, data: user });
});

// @desc    Change user role
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin)
exports.changeUserRole = asyncHandler(async (req, res, next) => {
  if (req.user.isImpersonation) {
    return res.status(403).json({ success: false, message: 'Action restricted during impersonation' });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }

  const validRoles = ['student', 'teacher', 'admin'];
  if (!validRoles.includes(req.body.role)) {
    return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (user._id.toString() === req.user.id) {
    return res.status(403).json({ success: false, message: 'Cannot change your own role' });
  }

  const previousRole = user.role;
  user.role = req.body.role;
  await user.save();

  await logAdminAction(req.user.id, 'CHANGE_ROLE', 'User', user._id, { previousRole, newRole: user.role }, req);

  res.status(200).json({ success: true, data: user });
});

// @desc    Suspend or activate account
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.changeUserStatus = asyncHandler(async (req, res, next) => {
  if (req.user.isImpersonation) {
    return res.status(403).json({ success: false, message: 'Action restricted during impersonation' });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }

  const validStatuses = ['active', 'suspended'];
  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be: active or suspended` });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (user._id.toString() === req.user.id) {
    return res.status(403).json({ success: false, message: 'Cannot suspend your own account' });
  }

  if (user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Cannot suspend another admin' });
  }

  const previousStatus = user.status;
  user.status = req.body.status;
  await user.save();

  const action = user.status === 'suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER';
  await logAdminAction(req.user.id, action, 'User', user._id, { previousStatus }, req);

  res.status(200).json({ success: true, data: user });
});

// @desc    Permanently delete user with full cascade cleanup
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  if (req.user.isImpersonation) {
    return res.status(403).json({ success: false, message: 'Action restricted during impersonation' });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (user._id.toString() === req.user.id) {
    return res.status(403).json({ success: false, message: 'Cannot delete your own account' });
  }

  if (user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Cannot delete another admin' });
  }

  // --- TEACHER CASCADE ---
  // If teacher, delete all their courses + all related data in each course
  if (user.role === 'teacher') {
    const teacherCourses = await Course.find({ teacher: user._id });
    // Run cascade for each course sequentially to avoid overwhelming the DB
    for (const course of teacherCourses) {
      await cascadeDeleteCourse(course._id);
    }
  }

  // --- STUDENT/SHARED CLEANUP ---
  await Promise.all([
    Enrollment.deleteMany({ student: user._id }),
    Submission.deleteMany({ student: user._id }),
    QuizAttempt.deleteMany({ student: user._id }),
    AttendanceRecord.deleteMany({ student: user._id }),
    Message.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] }),
    Notification.deleteMany({ user: user._id }),
    User.findByIdAndDelete(user._id)
  ]);

  await logAdminAction(
    req.user.id,
    'DELETE_USER',
    'User',
    user._id,
    { name: user.name, email: user.email, role: user.role },
    req
  );

  res.status(200).json({ success: true, message: 'User and all related data deleted successfully' });
});

// @desc    Generate impersonation token
// @route   POST /api/admin/users/:id/impersonate
// @access  Private (Admin)
exports.impersonateUser = asyncHandler(async (req, res, next) => {
  if (req.user.isImpersonation) {
    return res.status(403).json({ success: false, message: 'Cannot chain impersonation' });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }

  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

  const impersonationToken = jwt.sign(
    {
      id: targetUser._id,
      role: targetUser.role,
      impersonatedBy: req.user.id,
      isImpersonation: true
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // non-negotiable
  );

  await logAdminAction(
    req.user.id,
    'IMPERSONATE_START',
    'User',
    targetUser._id,
    { targetName: targetUser.name, targetRole: targetUser.role },
    req
  );

  res.status(200).json({ success: true, impersonationToken });
});

// @desc    Exit impersonation session
// @route   POST /api/admin/impersonate/exit
// @access  Private
exports.exitImpersonation = asyncHandler(async (req, res, next) => {
  if (!req.user.isImpersonation) {
    return res.status(400).json({ success: false, message: 'Not in an impersonation session' });
  }

  const { impersonatedBy } = req.user;
  const admin = await User.findById(impersonatedBy);

  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

  const adminToken = jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  await logAdminAction(admin._id, 'IMPERSONATE_EXIT', 'User', req.user.id, {}, req);

  res.status(200).json({ success: true, token: adminToken });
});
