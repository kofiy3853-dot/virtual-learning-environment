const Question = require('../models/Question');
const asyncHandler = require('express-async-handler');

// @desc    Add question to quiz
// @route   POST /api/quizzes/:id/questions
// @access  Private (Teacher)
exports.addQuestion = asyncHandler(async (req, res, next) => {
  req.body.quiz = req.params.id;
  const question = await Question.create(req.body);
  res.status(201).json({ success: true, data: question });
});

// @desc    Get questions for a quiz (without correct answers)
// @route   GET /api/quizzes/:id/questions
// @access  Private
exports.getQuestions = asyncHandler(async (req, res, next) => {
  const questions = await Question.find({ quiz: req.params.id }).sort('order');
  res.status(200).json({ success: true, count: questions.length, data: questions });
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Teacher)
exports.updateQuestion = asyncHandler(async (req, res, next) => {
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
  res.status(200).json({ success: true, data: question });
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Teacher)
exports.deleteQuestion = asyncHandler(async (req, res, next) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) return res.status(404).json({ success: false, message: 'Question not found' });
  res.status(200).json({ success: true, data: {} });
});
