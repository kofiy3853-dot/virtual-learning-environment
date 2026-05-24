const express = require('express');
const {
  getMyStats,
  getMyCourses,
  getPendingSubmissions,
  getCourseGradebook,
  getCourseAnalytics,
  getAtRiskStudents,
  getCourseAssignments,
  getAssignmentSubmissions,
  getCourseQuizzes,
  getQuizAttempts
} = require('../controllers/teacherController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

console.log('[TEACHER ROUTES] Registering teacher routes...');

// Test endpoint (no auth)
router.get('/test', (req, res) => {
  console.log('[TEACHER ROUTES] Test endpoint hit');
  res.json({ success: true, message: 'Teacher routes are working!' });
});

// IMPORTANT: Register specific routes BEFORE parameterized routes
// Teacher stats and courses (no params)
router.get('/me/stats', protect, authorize('teacher'), (req, res, next) => {
  console.log('[TEACHER ROUTES] /me/stats hit');
  next();
}, getMyStats);

router.get('/me/courses', protect, authorize('teacher'), (req, res, next) => {
  console.log('[TEACHER ROUTES] /me/courses hit');
  next();
}, getMyCourses);

router.get('/me/pending-submissions', protect, authorize('teacher'), (req, res, next) => {
  console.log('[TEACHER ROUTES] /me/pending-submissions hit');
  next();
}, getPendingSubmissions);

console.log('[TEACHER ROUTES] Registered routes: /test, /me/stats, /me/courses, /me/pending-submissions');

// Course-specific endpoints (with params - registered AFTER specific routes)
router.get('/me/courses/:courseId/gradebook', protect, authorize('teacher'), getCourseGradebook);
router.get('/me/courses/:courseId/analytics', protect, authorize('teacher'), getCourseAnalytics);
router.get('/me/courses/:courseId/at-risk', protect, authorize('teacher'), getAtRiskStudents);
router.get('/me/courses/:courseId/assignments', protect, authorize('teacher'), getCourseAssignments);
router.get('/me/courses/:courseId/quizzes', protect, authorize('teacher'), getCourseQuizzes);

// Assignment and quiz submissions
router.get('/me/assignments/:assignmentId/submissions', protect, authorize('teacher'), getAssignmentSubmissions);
router.get('/me/quizzes/:quizId/attempts', protect, authorize('teacher'), getQuizAttempts);

module.exports = router;
