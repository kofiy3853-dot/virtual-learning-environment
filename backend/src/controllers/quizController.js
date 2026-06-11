const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const GradeItem = require('../models/GradeItem');
const Course = require('../models/Course');
const asyncHandler = require('../middleware/asyncHandler');

exports.getQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ course: req.params.id }).sort('-createdAt').lean();

  // Attach question count to each quiz efficiently
  const counts = await Question.aggregate([
    { $match: { quiz: { $in: quizzes.map(q => q._id) } } },
    { $group: { _id: '$quiz', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
  const quizzesWithCount = quizzes.map(q => ({
    ...q,
    questionCount: countMap[q._id.toString()] ?? 0,
  }));

  res.status(200).json({ success: true, count: quizzes.length, data: quizzesWithCount });
});

exports.getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('course');
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  res.status(200).json({ success: true, data: quiz });
});

exports.createQuiz = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  req.body.course = req.params.id;
  const quiz = await Quiz.create(req.body);
  res.status(201).json({ success: true, data: quiz });
});

exports.updateQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  const course = await Course.findById(quiz.course);
  if (course && course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: updated });
});

exports.deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  const course = await Course.findById(quiz.course);
  if (course && course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  await quiz.deleteOne();
  await Promise.all([
    Question.deleteMany({ quiz: quiz._id }),
    QuizAttempt.deleteMany({ quiz: quiz._id }),
    GradeItem.deleteMany({ sourceId: quiz._id, sourceType: 'quiz' }),
  ]);
  res.status(200).json({ success: true, data: {} });
});

exports.publishQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });
  const course = await Course.findById(quiz.course);
  if (course && course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  quiz.isPublished = !quiz.isPublished;
  await quiz.save();
  res.status(200).json({ success: true, data: quiz });
});
