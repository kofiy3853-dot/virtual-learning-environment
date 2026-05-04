const express = require('express');
const {
  createQuiz,
  getQuizzes,
  addQuestion,
  getQuestions,
  startQuiz,
  submitQuiz,
  gradeAttempt,
} = require('../controllers/quizController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Course-level quiz routes
router.route('/')
  .get(protect, getQuizzes)
  .post(protect, authorize('teacher', 'admin'), createQuiz);

// Quiz-level routes
router.get('/:id/questions', protect, getQuestions);
router.post('/:id/questions', protect, authorize('teacher', 'admin'), addQuestion);
router.post('/:id/start', protect, authorize('student'), startQuiz);
router.post('/:id/submit', protect, authorize('student'), submitQuiz);

// Attempt grading
router.patch('/attempts/:id/grade', protect, authorize('teacher', 'admin'), gradeAttempt);

module.exports = router;
