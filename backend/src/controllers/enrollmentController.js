const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const mongoose = require('mongoose');

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private (Student)
exports.enrollCourse = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const enrollment = await Enrollment.create({
    student: req.user.id,
    course: req.params.id,
  });

  res.status(201).json({
    success: true,
    data: enrollment,
  });
};

// @desc    Drop a course
// @route   DELETE /api/courses/:id/enroll
// @access  Private (Student)
exports.dropCourse = async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const enrollment = await Enrollment.findOneAndDelete({
    student: req.user.id,
    course: req.params.id,
  });

  if (!enrollment) {
    return res.status(404).json({ success: false, message: 'Enrollment not found' });
  }

  res.status(200).json({
    success: true,
    data: {},
  });
};

const Assignment = require('../models/Assignment');
const Quiz = require('../models/Quiz');
const Submission = require('../models/Submission');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Get my enrolled courses with progress
// @route   GET /api/students/me/courses
// @access  Private (Student)
exports.getMyCourses = async (req, res, next) => {
  const enrollments = await Enrollment.find({ 
    student: req.user.id,
    status: { $in: ['active', 'completed'] }
  }).populate({
    path: 'course',
    populate: { path: 'teacher', select: 'name email' }
  });

  // Filter out enrollments where the course was deleted
  const validEnrollments = enrollments.filter(e => e.course != null);

  const courseData = await Promise.all(validEnrollments.map(async (e) => {
    try {
      const course = e.course.toObject();
      const courseId = course._id;

      // Fetch assignment IDs and quiz IDs in parallel
      const [assignmentIds, quizIds] = await Promise.all([
        Assignment.find({ course: courseId }).distinct('_id'),
        Quiz.find({ course: courseId }).distinct('_id'),
      ]);

      // Count totals and completions in parallel
      const [totalAssignments, totalQuizzes, submissions, quizAttempts] = await Promise.all([
        Promise.resolve(assignmentIds.length),
        Quiz.countDocuments({ course: courseId, isPublished: true }),
        assignmentIds.length > 0
          ? Submission.countDocuments({ assignment: { $in: assignmentIds }, student: req.user.id })
          : Promise.resolve(0),
        quizIds.length > 0
          ? QuizAttempt.countDocuments({ quiz: { $in: quizIds }, student: req.user.id })
          : Promise.resolve(0),
      ]);

      const totalItems = totalAssignments + totalQuizzes;
      const completedItems = submissions + quizAttempts;
      course.progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return course;
    } catch {
      return null;
    }
  }));

  const filteredCourseData = courseData.filter(course => course != null);

  res.status(200).json({
    success: true,
    count: filteredCourseData.length,
    data: filteredCourseData,
  });
};
