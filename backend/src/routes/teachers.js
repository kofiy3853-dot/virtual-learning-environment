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

// Test endpoint (no auth)
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Teacher routes are working!' });
});

// Teacher stats and courses
router.get('/me/stats', protect, authorize('teacher'), getMyStats);
router.get('/me/courses', protect, authorize('teacher'), getMyCourses);
router.get('/me/pending-submissions', protect, authorize('teacher'), getPendingSubmissions);

// Course-specific endpoints
router.get('/me/courses/:courseId/gradebook', protect, authorize('teacher'), getCourseGradebook);
router.get('/me/courses/:courseId/analytics', protect, authorize('teacher'), getCourseAnalytics);
router.get('/me/courses/:courseId/at-risk', protect, authorize('teacher'), getAtRiskStudents);
router.get('/me/courses/:courseId/assignments', protect, authorize('teacher'), getCourseAssignments);
router.get('/me/courses/:courseId/quizzes', protect, authorize('teacher'), getCourseQuizzes);

// Assignment and quiz submissions
router.get('/me/assignments/:assignmentId/submissions', protect, authorize('teacher'), getAssignmentSubmissions);
router.get('/me/quizzes/:quizId/attempts', protect, authorize('teacher'), getQuizAttempts);

module.exports = router;
