const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const GradeItem = require('../models/GradeItem');
const GradeBook = require('../models/GradeBook');
const Course = require('../models/Course');
const asyncHandler = require('../middleware/asyncHandler');

const syncToGradeBook = async (quiz, attempt) => {
  let gradeBook = await GradeBook.findOne({ course: quiz.course });
  if (!gradeBook) {
    const course = await Course.findById(quiz.course);
    gradeBook = await GradeBook.create({
      course: quiz.course,
      semester: course.semester,
      academicYear: course.academicYear,
    });
  }
  await GradeItem.findOneAndUpdate(
    { student: attempt.student, sourceId: quiz._id },
    { gradeBook: gradeBook._id, sourceType: 'quiz', score: attempt.score, maxScore: attempt.totalMarks, percentage: attempt.percentage },
    { upsert: true, runValidators: true, new: true }
  );
};

exports.startAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  if (!quiz.isPublished) {
    return res.status(403).json({ success: false, message: 'This quiz has not been published yet' });
  }

  const existingAttempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user.id });
  if (existingAttempt) {
    // Return existing in-progress attempt with questions so student can continue
    if (existingAttempt.status === 'in_progress') {
      const questions = await Question.find({ quiz: req.params.id }).sort('order');
      return res.status(200).json({ success: true, data: { attempt: existingAttempt, questions } });
    }
    return res.status(400).json({ success: false, message: 'You have already completed this quiz' });
  }

  const attempt = await QuizAttempt.create({
    quiz: req.params.id, student: req.user.id,
    totalMarks: quiz.totalMarks, status: 'in_progress',
  });

  const questions = await Question.find({ quiz: req.params.id }).sort('order');
  res.status(200).json({ success: true, data: { attempt, questions } });
});

exports.submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user.id });
  if (!attempt || attempt.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: 'No active attempt found' });
  }

  const quiz = await Quiz.findById(req.params.id);
  const questions = await Question.find({ quiz: req.params.id }).select('+correctAnswer');
  const answers = req.body.answers;
  let score = 0;
  let hasShortAnswer = false;

  answers.forEach(ans => {
    const question = questions.find(q => q._id.toString() === ans.questionId);
    if (question) {
      if (question.type === 'short_answer') {
        hasShortAnswer = true;
      } else if (question.correctAnswer === ans.answer) {
        score += question.marks;
      }
    }
  });

  attempt.answers = answers;
  attempt.score = score;
  attempt.percentage = (score / attempt.totalMarks) * 100;
  attempt.status = hasShortAnswer ? 'submitted' : 'graded';
  attempt.submittedAt = new Date();
  await attempt.save();

  if (!hasShortAnswer) await syncToGradeBook(quiz, attempt);

  res.status(200).json({ success: true, data: attempt });
});

exports.getMyAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user.id });
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  res.status(200).json({ success: true, data: attempt });
});

exports.getAllAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({ quiz: req.params.id }).populate('student', 'name email');
  res.status(200).json({ success: true, count: attempts.length, data: attempts });
});

exports.gradeAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.id).populate('quiz');
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  if (attempt.status === 'graded') {
    return res.status(400).json({ success: false, message: 'Attempt has already been graded' });
  }

  const { scoreAdjustment, feedback } = req.body;
  attempt.score = Math.min(Math.max(0, attempt.score + (Number(scoreAdjustment) || 0)), attempt.totalMarks);
  attempt.percentage = (attempt.score / attempt.totalMarks) * 100;
  attempt.status = 'graded';
  if (feedback) attempt.feedback = feedback;
  await attempt.save();

  await syncToGradeBook(attempt.quiz, attempt);
  res.status(200).json({ success: true, data: attempt });
});
