const express = require('express');
const {
  createSession,
  markAttendance,
  getSessionRecords,
  getCourseAttendanceSummary,
} = require('../controllers/attendanceController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Course level
router.route('/')
  .post(protect, authorize('teacher', 'admin'), validate(schemas.createAttendanceSession), createSession);

router.get('/summary', protect, authorize('teacher', 'admin'), getCourseAttendanceSummary);

// Session level
router.route('/:sessionId')
  .get(protect, authorize('teacher', 'admin'), getSessionRecords);

router.post('/:sessionId/mark', protect, authorize('teacher', 'admin'), validate(schemas.markAttendance), markAttendance);

module.exports = router;
