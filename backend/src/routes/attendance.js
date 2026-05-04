const express = require('express');
const {
  createSession,
  markAttendance,
  getSessionRecords,
  getCourseAttendanceSummary,
} = require('../controllers/attendanceController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Course level
router.route('/')
  .post(protect, authorize('teacher', 'admin'), createSession);

router.get('/summary', protect, authorize('teacher', 'admin'), getCourseAttendanceSummary);

// Session level
router.route('/:sessionId')
  .get(protect, authorize('teacher', 'admin'), getSessionRecords);

router.post('/:sessionId/mark', protect, authorize('teacher', 'admin'), markAttendance);

module.exports = router;
