const Course = require('../models/Course');
const User = require('../models/User');
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
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const logAdminAction = require('../utils/logAdminAction');

// @desc    List all courses with filters and enrollment counts
// @route   GET /api/admin/courses
// @access  Private (Admin)
exports.getCourses = asyncHandler(async (req, res, next) => {
  const { status, teacher, search, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const match = {};
  if (status) match.status = status;
  if (teacher) {
    if (!mongoose.Types.ObjectId.isValid(teacher)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher ID' });
    }
    match.teacher = new mongoose.Types.ObjectId(teacher);
  }
  if (search) {
    match.$or = [
      { title: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ];
  }

  const courses = await Course.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'enrollments',
        localField: '_id',
        foreignField: 'course',
        as: 'enrollments'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'teacher',
        foreignField: '_id',
        as: 'teacherInfo'
      }
    },
    { $unwind: '$teacherInfo' },
    {
      $project: {
        title: 1,
        code: 1,
        status: 1,
        semester: 1,
        academicYear: 1,
        createdAt: 1, // FIX: include so sort works correctly
        enrollmentCount: { $size: '$enrollments' },
        teacher: { _id: '$teacherInfo._id', name: '$teacherInfo.name' }
      }
    },
    { $sort: { createdAt: -1 } }, // now sorts on projected field
    { $skip: skip },
    { $limit: Number(limit) }
  ]);

  const count = await Course.countDocuments(match);

  res.status(200).json({
    success: true,
    count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
    data: courses
  });
});

// @desc    Get course detail with enrollment count
// @route   GET /api/admin/courses/:id
// @access  Private (Admin)
exports.getCourse = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  const course = await Course.findById(req.params.id).populate('teacher', 'name email');
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const enrollmentCount = await Enrollment.countDocuments({ course: req.params.id });

  res.status(200).json({
    success: true,
    data: {
      ...course.toObject(), // FIX: use .toObject() not ._doc
      enrollmentCount
    }
  });
});

// @desc    Reassign teacher to course
// @route   PATCH /api/admin/courses/:id/teacher
// @access  Private (Admin)
exports.reassignTeacher = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({ success: false, message: 'Invalid teacher ID' });
  }

  const newTeacher = await User.findOne({ _id: teacherId, role: 'teacher' });
  if (!newTeacher) return res.status(400).json({ success: false, message: 'User not found or is not a teacher' });

  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const previousTeacherId = course.teacher;
  course.teacher = teacherId;
  await course.save();

  await logAdminAction(req.user.id, 'REASSIGN_TEACHER', 'Course', course._id, { previousTeacherId, newTeacherId: teacherId }, req);

  res.status(200).json({ success: true, data: course });
});

// @desc    Archive or reactivate course
// @route   PATCH /api/admin/courses/:id/status
// @access  Private (Admin)
exports.changeCourseStatus = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  const validStatuses = ['draft', 'active', 'archived'];
  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const previousStatus = course.status;
  course.status = req.body.status;
  await course.save();

  // FIX: compute action correctly, ARCHIVE_COURSE is valid in AdminLog enum
  const action = course.status === 'archived' ? 'ARCHIVE_COURSE' : 'ACTIVATE_USER';
  await logAdminAction(
    req.user.id,
    action,
    'Course',
    course._id,
    { previousStatus, newStatus: course.status },
    req
  );

  res.status(200).json({ success: true, data: course });
});

// @desc    Delete course with deep cascade across all 17 related collections
// @route   DELETE /api/admin/courses/:id
// @access  Private (Admin)
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }

  const courseId = req.params.id;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const enrollmentCount = await Enrollment.countDocuments({ course: courseId });

  // Fetch IDs for nested cleanup before deleting parent documents
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

  await logAdminAction(
    req.user.id,
    'DELETE_COURSE',
    'Course',
    courseId,
    { title: course.title, code: course.code, enrollmentCount },
    req
  );

  res.status(200).json({ success: true, message: 'Course and all related data deleted successfully' });
});
