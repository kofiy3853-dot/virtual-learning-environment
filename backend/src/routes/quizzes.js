const express = require('express');
const {
  createQuiz,
  addQuestion,
  startQuiz,
  submitQuiz,
  gradeAttempt,
} = require('../controllers/quizController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Teacher routes
router.post('/', protect, authorize('teacher', 'admin'), createQuiz);
router.post('/:id/questions', protect, authorize('teacher', 'admin'), addQuestion);
router.patch('/attempts/:id/grade', protect, authorize('teacher', 'admin'), gradeAttempt);

// Student routes
router.post('/:id/start', protect, authorize('student'), startQuiz);
router.post('/:id/submit', protect, authorize('student'), submitQuiz);

module.exports = router;
