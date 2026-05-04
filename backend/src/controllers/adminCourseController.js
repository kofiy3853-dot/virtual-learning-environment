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
const logAdminAction = require('../utils/logAdminAction');

// @desc    List all courses with filters and enrollment counts
// @route   GET /api/admin/courses
// @access  Private (Admin)
exports.getCourses = asyncHandler(async (req, res, next) => {
  const { status, teacher, search, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // Build match stage for aggregation
  const match = {};
  if (status) match.status = status;
  if (teacher) match.teacher = teacher;
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
        enrollmentCount: { $size: '$enrollments' },
        teacher: { _id: '$teacherInfo._id', name: '$teacherInfo.name' }
      }
    },
    { $sort: { createdAt: -1 } },
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

// @desc    Get course detail
// @route   GET /api/admin/courses/:id
// @access  Private (Admin)
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate('teacher', 'name email');
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const enrollmentCount = await Enrollment.countDocuments({ course: req.params.id });

  res.status(200).json({
    success: true,
    data: {
      ...course._doc,
      enrollmentCount
    }
  });
});

// @desc    Reassign teacher to course
// @route   PATCH /api/admin/courses/:id/teacher
// @access  Private (Admin)
exports.reassignTeacher = asyncHandler(async (req, res, next) => {
  const { teacherId } = req.body;
  
  const newTeacher = await User.findOne({ _id: teacherId, role: 'teacher' });
  if (!newTeacher) return res.status(400).json({ success: false, message: 'Invalid teacher ID' });

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
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const previousStatus = course.status;
  course.status = req.body.status;
  await course.save();

  const action = course.status === 'archived' ? 'ARCHIVE_COURSE' : 'ACTIVATE_USER'; // Note: Prompt uses ARCHIVE_COURSE, but for reactivation we can use another or just ACTIVATE
  await logAdminAction(req.user.id, action === 'archived' ? 'ARCHIVE_COURSE' : 'ACTIVATE_USER', 'Course', course._id, { previousStatus, newStatus: course.status }, req);

  res.status(200).json({ success: true, data: course });
});

// @desc    Delete course with deep cascade
// @route   DELETE /api/admin/courses/:id
// @access  Private (Admin)
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const courseId = req.params.id;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const enrollmentCount = await Enrollment.countDocuments({ course: courseId });

  // Fetch IDs for nested cleanup
  const assignments = await Assignment.find({ course: courseId });
  const assignmentIds = assignments.map(a => a._id);

  const gradeBooks = await GradeBook.find({ course: courseId });
  const gradeBookIds = gradeBooks.map(g => g._id);

  const quizzes = await Quiz.find({ course: courseId });
  const quizIds = quizzes.map(q => q._id);

  const sessions = await AttendanceSession.find({ course: courseId });
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

  await logAdminAction(req.user.id, 'DELETE_COURSE', 'Course', courseId, { title: course.title, code: course.code, enrollmentCount }, req);

  res.status(200).json({ success: true, message: 'Course and all related data deleted successfully' });
});
