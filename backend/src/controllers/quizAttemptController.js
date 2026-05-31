const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const QuizAttempt = require('../models/QuizAttempt');
const GradeItem = require('../models/GradeItem');
const GradeBook = require('../models/GradeBook');
const Course = require('../models/Course');

// Helper to sync quiz score to GradeItem
const syncToGradeBook = async (quiz, attempt) => {
  let gradeBook = await GradeBook.findOne({ course: quiz.course });
  if (!gradeBook) {
    const course = await Course.findById(quiz.course);
    gradeBook = await GradeBook.create({
      course: quiz.course,
      semester: course.semester,
      academicYear: course.academicYear
    });
  }

  await GradeItem.findOneAndUpdate(
    { student: attempt.student, sourceId: quiz._id },
    {
      gradeBook: gradeBook._id,
      sourceType: 'quiz',
      score: attempt.score,
      maxScore: attempt.totalMarks,
      percentage: attempt.percentage
    },
    { upsert: true, runValidators: true, new: true }
  );
};

// @desc    Start quiz attempt
// @route   POST /api/quizzes/:id/start
// @access  Private (Student)
exports.startAttempt = async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

  // Security checks
  const now = new Date();
  if (now < quiz.startTime || now > quiz.endTime) {
    return res.status(403).json({ success: false, message: 'Quiz is not available at this time' });
  }

  const existingAttempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user.id });
  if (existingAttempt) {
    return res.status(400).json({ success: false, message: 'You have already attempted this quiz' });
  }

  const attempt = await QuizAttempt.create({
    quiz: req.params.id,
    student: req.user.id,
    totalMarks: quiz.totalMarks,
    status: 'in_progress'
  });

  // Get questions (without correct answers)
  const questions = await Question.find({ quiz: req.params.id }).sort('order');

  res.status(200).json({ success: true, data: { attempt, questions } });
};

// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student)
exports.submitAttempt = async (req, res, next) => {
  const attempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user.id });
  if (!attempt || attempt.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: 'No active attempt found' });
  }

  const quiz = await Quiz.findById(req.params.id);
  const questions = await Question.find({ quiz: req.params.id }).select('+correctAnswer');
  
  const answers = req.body.answers; // [{ questionId, answer }]
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

  // If no short answers, plug into GradeBook
  if (!hasShortAnswer) {
    await syncToGradeBook(quiz, attempt);
  }

  res.status(200).json({ success: true, data: attempt });
};

// @desc    Get current user's attempt for a quiz
// @route   GET /api/quizzes/:id/my-attempt
// @access  Private (Student)
exports.getMyAttempt = async (req, res, next) => {
  const attempt = await QuizAttempt.findOne({ quiz: req.params.id, student: req.user.id });
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });
  res.status(200).json({ success: true, data: attempt });
};

// @desc    Get all attempts for a quiz
// @route   GET /api/quizzes/:id/attempts
// @access  Private (Teacher)
exports.getAllAttempts = async (req, res, next) => {
  const attempts = await QuizAttempt.find({ quiz: req.params.id }).populate('student', 'name email');
  res.status(200).json({ success: true, count: attempts.length, data: attempts });
};

// @desc    Manually grade short answers
// @route   PATCH /api/attempts/:id/grade
// @access  Private (Teacher)
exports.gradeAttempt = async (req, res, next) => {
  const attempt = await QuizAttempt.findById(req.params.id).populate('quiz');
  if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

  if (attempt.status === 'graded') {
    return res.status(400).json({ success: false, message: 'Attempt has already been graded' });
  }

  const { scoreAdjustment, feedback } = req.body;
  attempt.score = Math.min(
    Math.max(0, attempt.score + (Number(scoreAdjustment) || 0)),
    attempt.totalMarks
  );
  attempt.percentage = (attempt.score / attempt.totalMarks) * 100;
  attempt.status = 'graded';
  if (feedback) attempt.feedback = feedback;
  await attempt.save();

  // attempt.quiz is already populated — no double-fetch needed
  await syncToGradeBook(attempt.quiz, attempt);

  res.status(200).json({ success: true, data: attempt });
};
