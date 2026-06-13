const express = require('express');
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, schemas } = require('../middleware/validation');

// Controllers
const { getModules, createModule } = require('../controllers/moduleController');
const { addContent, getModuleContent } = require('../controllers/contentController');
const { setGradeWeights, getGradeWeights, getGradeBook } = require('../controllers/gradeController');
const { getCourseAnalytics, getAtRiskStudents } = require('../controllers/analyticsController');
const { createSession, getCourseSessions, getCourseAttendanceSummary, markAttendance, getSessionRecords, getMyAttendance } = require('../controllers/attendanceController');
const { createAnnouncement, getAnnouncements, startDiscussion, getDiscussions } = require('../controllers/communicationController');
const { createLiveSession, getLiveSessions, startSession, endSession, joinSession } = require('../controllers/liveSessionController');
const { enrollCourse, dropCourse } = require('../controllers/enrollmentController');
const { getMyCourseSubmissions } = require('../controllers/submissionController');
const { getAssignments, createAssignment } = require('../controllers/assignmentController');
const { submitAssignment, getSubmissions, getMySubmission } = require('../controllers/submissionController');
const { getQuizzes, createQuiz, getQuiz, updateQuiz, deleteQuiz, publishQuiz } = require('../controllers/quizController');
const { getQuestions, addQuestion, bulkAddQuestions } = require('../controllers/questionController');
const { startAttempt, submitAttempt, getMyAttempt, getAllAttempts, gradeAttempt, resetAttempt } = require('../controllers/quizAttemptController');

// ─── ENROLLMENT ─────────────────────────────────────────────────────────────
router.post('/enroll', protect, authorize('student'), enrollCourse);
router.delete('/enroll', protect, authorize('student'), dropCourse);

// ─── MODULES ────────────────────────────────────────────────────────────────
router.get('/modules', protect, getModules);
router.post(
  '/modules',
  protect,
  authorize('teacher', 'admin'),
  validate(schemas.createModule),
  createModule
);

// Lessons (content items) within a module
// POST /api/courses/:courseId/modules/:modId/lessons
router.post(
  '/modules/:modId/lessons',
  protect,
  authorize('teacher', 'admin'),
  upload.single('file'),
  // Content controller expects moduleId in req.params.id
  (req, res, next) => {
    req.params.id = req.params.modId;
    next();
  },
  addContent
);

// ─── GRADES ─────────────────────────────────────────────────────────────────
router.get('/gradebook', protect, authorize('teacher', 'admin'), getGradeBook);
router.get('/analytics', protect, authorize('teacher', 'admin'), getCourseAnalytics);
router.get('/analytics/at-risk', protect, authorize('teacher', 'admin'), getAtRiskStudents);
router.get('/grade-weights', protect, getGradeWeights);
router.post(
  '/grade-weights',
  protect,
  authorize('teacher', 'admin'),
  validate(schemas.gradeWeight),
  setGradeWeights
);

// ─── ATTENDANCE ─────────────────────────────────────────────────────────────
router.post(
  '/attendance',
  protect,
  authorize('teacher', 'admin'),
  validate(schemas.createAttendanceSession),
  createSession
);
router.get('/attendance', protect, getCourseSessions);
router.get('/attendance/summary', protect, getCourseAttendanceSummary);
router.post('/attendance/:sessionId/mark', protect, authorize('teacher', 'admin'), validate(schemas.markAttendance), markAttendance);
router.get('/attendance/:sessionId', protect, authorize('teacher', 'admin'), getSessionRecords);
router.get('/my-attendance', protect, authorize('student'), getMyAttendance);

// ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
router.post(
  '/announcements',
  protect,
  authorize('teacher', 'admin'),
  validate(schemas.createAnnouncement),
  createAnnouncement
);
router.get('/announcements', protect, getAnnouncements);

// ─── DISCUSSIONS ────────────────────────────────────────────────────────────
router.post('/discussions', protect, validate(schemas.createDiscussion), startDiscussion);
router.get('/discussions', protect, getDiscussions);

// ─── LIVE SESSIONS ──────────────────────────────────────────────────────────
router.post(
  '/live-sessions',
  protect,
  authorize('teacher', 'admin'),
  validate(schemas.createLiveSession),
  createLiveSession
);
router.get('/live-sessions', protect, getLiveSessions);
router.patch('/live-sessions/:id/start', protect, authorize('teacher', 'admin'), startSession);
router.patch('/live-sessions/:id/end', protect, authorize('teacher', 'admin'), endSession);
router.get('/live-sessions/:id/join', protect, joinSession);
router.get('/my-submissions', protect, authorize('student'), getMyCourseSubmissions);

  // ─── ASSIGNMENTS ───────────────────────────────────────────────────────────────
  router.get('/assignments', protect, getAssignments);
  router.post(
    '/assignments',
    protect,
    authorize('teacher', 'admin'),
    validate(schemas.createAssignment),
    createAssignment
  );
  router.post(
    '/assignments/:id/submit',
    protect,
    authorize('student'),
    upload.array('files', 5),
    submitAssignment
  );
  router.get('/assignments/:id/submissions', protect, authorize('teacher', 'admin'), getSubmissions);
  router.get('/assignments/:id/my-submission', protect, authorize('student'), getMySubmission);

  // ─── QUIZZES ───────────────────────────────────────────────────────────────────
  router.get('/quizzes', protect, getQuizzes);
  router.post(
    '/quizzes',
    protect,
    authorize('teacher', 'admin'),
    validate(schemas.createQuiz),
    createQuiz
  );
  router.get('/quizzes/:id', protect, getQuiz);
  router.put(
    '/quizzes/:id',
    protect,
    authorize('teacher', 'admin'),
    validate(schemas.updateQuiz),
    updateQuiz
  );
  router.delete('/quizzes/:id', protect, authorize('teacher', 'admin'), deleteQuiz);
  router.patch('/quizzes/:id/publish', protect, authorize('teacher', 'admin'), publishQuiz);

  // Questions
  router.get('/quizzes/:id/questions', protect, getQuestions);
  router.post(
    '/quizzes/:id/questions/bulk',
    protect,
    authorize('teacher', 'admin'),
    bulkAddQuestions
  );
  router.post(
    '/quizzes/:id/questions',
    protect,
    authorize('teacher', 'admin'),
    validate(schemas.createQuestion),
    addQuestion
  );

  // Quiz Attempts
  router.post('/quizzes/:id/start', protect, authorize('student'), startAttempt);
  router.post(
    '/quizzes/:id/submit',
    protect,
    authorize('student'),
    validate(schemas.submitQuiz),
    submitAttempt
  );
  router.get('/quizzes/:id/my-attempt', protect, authorize('student'), getMyAttempt);
  router.get('/quizzes/:id/attempts', protect, authorize('teacher', 'admin'), getAllAttempts);

  // ─── CONTENT (Module Lessons) ──────────────────────────────────────────────────
  router.get('/modules/:modId/content', protect, getModuleContent);

module.exports = router;
