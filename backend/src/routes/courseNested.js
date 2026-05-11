const express = require('express');
const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, schemas } = require('../middleware/validation');

// Controllers
const { getModules, createModule } = require('../controllers/moduleController');
const { addContent } = require('../controllers/contentController');
const { setGradeWeights, getGradeWeights, getGradeBook } = require('../controllers/gradeController');
const { getCourseAnalytics, getAtRiskStudents } = require('../controllers/analyticsController');
const { createSession, getCourseSessions, getCourseAttendanceSummary } = require('../controllers/attendanceController');
const { createAnnouncement, getAnnouncements, startDiscussion, getDiscussions } = require('../controllers/communicationController');
const { createLiveSession, getLiveSessions } = require('../controllers/liveSessionController');
const { enrollCourse, dropCourse } = require('../controllers/enrollmentController');
const { getMyCourseSubmissions } = require('../controllers/submissionController');

// ─── ENROLLMENT ─────────────────────────────────────────────────────────────
router.post('/enroll', protect, authorize('student'), enrollCourse);
router.delete('/enroll', protect, authorize('student'), dropCourse);

// ─── MODULES ────────────────────────────────────────────────────────────────
router.get('/modules', protect, getModules);
router.post(
  '/modules',
  protect,
  authorize('teacher', 'admin'),
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
  setGradeWeights
);

// ─── ATTENDANCE ─────────────────────────────────────────────────────────────
router.post(
  '/attendance',
  protect,
  authorize('teacher', 'admin'),
  createSession
);
router.get('/attendance', protect, getCourseSessions);
router.get('/attendance/summary', protect, getCourseAttendanceSummary);

// ─── ANNOUNCEMENTS ──────────────────────────────────────────────────────────
router.post(
  '/announcements',
  protect,
  authorize('teacher', 'admin'),
  createAnnouncement
);
router.get('/announcements', protect, getAnnouncements);

// ─── DISCUSSIONS ────────────────────────────────────────────────────────────
router.post('/discussions', protect, startDiscussion);
router.get('/discussions', protect, getDiscussions);

// ─── LIVE SESSIONS ──────────────────────────────────────────────────────────
router.post(
  '/live-sessions',
  protect,
  authorize('teacher', 'admin'),
  createLiveSession
);
router.get('/live-sessions', protect, getLiveSessions);
router.get('/my-submissions', protect, authorize('student'), getMyCourseSubmissions);

module.exports = router;
