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

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const startIndex = (page - 1) * limit;

  const total = await Question.countDocuments({ quiz: req.params.id });

  let query = Question.find({ quiz: req.params.id })
    .sort('order')
    .skip(startIndex)
    .limit(limit);

  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    query = query.select('+correctAnswer');
  }

  const questions = await query;

  const pagination = {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit)
  };

  res.status(200).json({ success: true, count: questions.length, pagination, data: questions });
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

// @desc    Bulk-add questions to a quiz from an uploaded JSON array
// @route   POST /api/v1/quizzes/:id/questions/bulk
// @access  Private/Teacher|Admin
exports.bulkAddQuestions = asyncHandler(async (req, res) => {
  const { error, status, quiz } = await verifyQuizOwnership(req.params.id, req.user.id, req.user.role);
  if (error) return res.status(status).json({ success: false, message: error });

  const incoming = req.body.questions;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ success: false, message: 'Provide a non-empty questions array' });
  }

  // Determine starting order (continue after existing questions)
  const existingCount = await Question.countDocuments({ quiz: req.params.id });

  const VALID_TYPES = ['multiple_choice', 'true_false', 'short_answer'];
  const docs = [];
  const errors = [];

  incoming.forEach((q, idx) => {
    const rowNum = idx + 1;
    if (!q.text || typeof q.text !== 'string' || !q.text.trim()) {
      errors.push(`Row ${rowNum}: "text" is required`);
      return;
    }
    if (!VALID_TYPES.includes(q.type)) {
      errors.push(`Row ${rowNum}: "type" must be one of ${VALID_TYPES.join(', ')}`);
      return;
    }
    const marks = parseInt(q.marks, 10);
    if (isNaN(marks) || marks < 1) {
      errors.push(`Row ${rowNum}: "marks" must be a positive integer`);
      return;
    }
    if (q.type !== 'short_answer' && (!q.correctAnswer || String(q.correctAnswer).trim() === '')) {
      errors.push(`Row ${rowNum}: "correctAnswer" is required for type "${q.type}"`);
      return;
    }
    docs.push({
      quiz: req.params.id,
      text: q.text.trim(),
      type: q.type,
      options: Array.isArray(q.options) ? q.options.filter(Boolean) : [],
      correctAnswer: q.correctAnswer !== undefined ? String(q.correctAnswer).trim() : undefined,
      marks,
      order: existingCount + idx + 1,
      explanation: q.explanation ? String(q.explanation).trim() : undefined,
    });
  });

  if (errors.length > 0) {
    return res.status(422).json({ success: false, message: 'Validation errors', errors });
  }

  const created = await Question.insertMany(docs);

  // Update quiz totalMarks to reflect all questions
  const allQuestions = await Question.find({ quiz: req.params.id });
  const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);
  await Quiz.findByIdAndUpdate(req.params.id, { totalMarks });

  res.status(201).json({ success: true, count: created.length, data: created });
});

