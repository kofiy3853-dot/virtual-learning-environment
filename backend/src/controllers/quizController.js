const Quiz = require('../models/Quiz');

// @desc    Get all quizzes for a course
// @route   GET /api/courses/:id/quizzes
// @access  Private
exports.getQuizzes = async (req, res, next) => {
  const quizzes = await Quiz.find({ course: req.params.id }).sort('-createdAt');
  res.status(200).json({ success: true, count: quizzes.length, data: quizzes });
};

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuiz = async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  res.status(200).json({ success: true, data: quiz });
};

// @desc    Create a quiz
// @route   POST /api/courses/:id/quizzes
// @access  Private (Teacher)
exports.createQuiz = async (req, res, next) => {
  req.body.course = req.params.id;
  const quiz = await Quiz.create(req.body);
  res.status(201).json({ success: true, data: quiz });
};

// @desc    Update a quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Teacher)
exports.updateQuiz = async (req, res, next) => {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  res.status(200).json({ success: true, data: quiz });
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Teacher)
exports.deleteQuiz = async (req, res, next) => {
  const quiz = await Quiz.findByIdAndDelete(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  res.status(200).json({ success: true, data: {} });
};

// @desc    Publish a quiz
// @route   PATCH /api/quizzes/:id/publish
// @access  Private (Teacher)
exports.publishQuiz = async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  // Toggle isPublished
  quiz.isPublished = !quiz.isPublished;
  await quiz.save();

  res.status(200).json({ success: true, data: quiz });
};
