const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getUsers,
  getUser,
  changeUserRole,
  changeUserStatus,
  deleteUser,
  impersonateUser,
  exitImpersonation
} = require('../controllers/adminUserController');

const {
  getCourses,
  getCourse,
  reassignTeacher,
  changeCourseStatus,
  deleteCourse
} = require('../controllers/adminCourseController');

const {
  getOverview,
  getUserAnalytics,
  getCourseAnalytics,
  getGradeAnalytics,
  getAttendanceAnalytics,
  getActivityLogs,
  getEnrollmentTrends
} = require('../controllers/adminAnalyticsController');

const {
  getLogs,
  getUserLogs
} = require('../controllers/adminLogController');

// Apply auth to all admin routes
router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.patch('/users/:id/role', changeUserRole);
router.patch('/users/:id/status', changeUserStatus);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/impersonate', impersonateUser);
router.post('/impersonate/exit', exitImpersonation);

// Course management
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.patch('/courses/:id/teacher', reassignTeacher);
router.patch('/courses/:id/status', changeCourseStatus);
router.delete('/courses/:id', deleteCourse);

// Analytics
router.get('/analytics/overview', getOverview);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/courses', getCourseAnalytics);
router.get('/analytics/grades', getGradeAnalytics);
router.get('/analytics/attendance', getAttendanceAnalytics);
router.get('/analytics/activity-logs', getActivityLogs);
router.get('/analytics/enrollment-trends', getEnrollmentTrends);

// Logs
router.get('/logs', getLogs);
router.get('/logs/:userId', getUserLogs);

module.exports = router;
