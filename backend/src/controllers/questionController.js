const Question = require('../models/Question');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const QuizAttempt = require('../models/QuizAttempt');
const asyncHandler = require('../middleware/asyncHandler');

async function verifyQuizOwnership(quizId, userId, userRole) {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) return { error: 'Quiz not found', status: 404 };
  if (userRole === 'admin') return { quiz };
  const course = await Course.findById(quiz.course);
  if (course && course.teacher.toString() !== userId) {
    return { error: 'Not authorized', status: 403 };
  }
  return { quiz };
}

exports.addQuestion = asyncHandler(async (req, res) => {
  const { error, status } = await verifyQuizOwnership(req.params.id, req.user.id, req.user.role);
  if (error) return res.status(status).json({ success: false, message: error });
  req.body.quiz = req.params.id;
  const question = await Question.create(req.body);
  res.status(201).json({ success: true, data: question });
});

exports.getQuestions = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  // Students cannot access questions for unpublished quizzes
  if (!quiz.isPublished && req.user.role === 'student') {
    return res.status(403).json({ success: false, message: 'This quiz has not been published yet' });
  }

  const questions = await Question.find({ quiz: req.params.id }).sort('order');
  res.status(200).json({ success: true, count: questions.length, data: questions });
});

exports.updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
  const { error, status } = await verifyQuizOwnership(question.quiz, req.user.id, req.user.role);
  if (error) return res.status(status).json({ success: false, message: error });
  const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: updated });
});

exports.deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
  const { error, status } = await verifyQuizOwnership(question.quiz, req.user.id, req.user.role);
  if (error) return res.status(status).json({ success: false, message: error });
  await question.deleteOne();
  res.status(200).json({ success: true, data: {} });
});
