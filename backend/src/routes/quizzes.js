const express = require('express');
const quizRouter = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz
} = require('../controllers/quizController');
const {
  getQuestions, // Adding getQuestions from the controller
  addQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questionController');
const {
  startAttempt,
  submitAttempt,
  getMyAttempt,
  getAllAttempts,
  gradeAttempt
} = require('../controllers/quizAttemptController');

quizRouter.get('/courses/:id/quizzes', protect, getQuizzes);
quizRouter.post('/courses/:id/quizzes',
  protect,
  authorize('teacher'),
  validate(schemas.createQuiz),
  createQuiz
);
quizRouter.get('/quizzes/:id', protect, getQuiz);
quizRouter.put('/quizzes/:id',
  protect,
  authorize('teacher'),
  validate(schemas.updateQuiz),
  updateQuiz
);
quizRouter.delete('/quizzes/:id', protect, authorize('teacher'), deleteQuiz);
quizRouter.patch('/quizzes/:id/publish', protect, authorize('teacher'), publishQuiz);

// Questions
quizRouter.get('/quizzes/:id/questions', protect, getQuestions); // Kept getQuestions
quizRouter.post('/quizzes/:id/questions',
  protect,
  authorize('teacher'),
  validate(schemas.createQuestion),
  addQuestion
);
quizRouter.put('/questions/:id', protect, authorize('teacher'), updateQuestion);
quizRouter.delete('/questions/:id', protect, authorize('teacher'), deleteQuestion);

// Attempts
quizRouter.post('/quizzes/:id/start', protect, authorize('student'), startAttempt);
quizRouter.post('/quizzes/:id/submit',
  protect,
  authorize('student'),
  validate(schemas.submitQuiz),
  submitAttempt
);
quizRouter.get('/quizzes/:id/my-attempt', protect, authorize('student'), getMyAttempt);
quizRouter.get('/quizzes/:id/attempts', protect, authorize('teacher'), getAllAttempts);
quizRouter.patch('/attempts/:id/grade', protect, authorize('teacher'), validate(schemas.gradeAttempt), gradeAttempt);

module.exports = quizRouter;
