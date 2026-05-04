const express = require('express');
const { getMyCourses } = require('../controllers/enrollmentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.get('/me/courses', protect, authorize('student'), getMyCourses);

const { getMyGrades, getMyCourseGrades } = require('../controllers/gradeController');
router.get('/me/grades', protect, authorize('student'), getMyGrades);
router.get('/me/grades/:courseId', protect, authorize('student'), getMyCourseGrades);
router.get('/me/grades/:courseId/final', protect, authorize('student'), getMyCourseGrades); // Reusing for simplicity

const { getMyAttendance } = require('../controllers/attendanceController');
router.get('/me/attendance/:courseId', protect, authorize('student'), getMyAttendance);

module.exports = router;
