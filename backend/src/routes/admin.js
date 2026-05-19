const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const {
  getUsers,
  getUser,
  updateUser,
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
  approveCourse,
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

// Allow teachers to view/search users for enrolling students
router.get('/users', authorize('admin', 'teacher'), getUsers);

router.use(authorize('admin'));
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/role', validate(schemas.changeRole), changeUserRole);
router.patch('/users/:id/status', validate(schemas.changeStatus), changeUserStatus);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/impersonate', impersonateUser);
router.post('/impersonate/exit', exitImpersonation);

// Course management
router.get('/courses', getCourses);
router.get('/courses/:id', getCourse);
router.patch('/courses/:id/teacher', validate(schemas.reassignTeacher), reassignTeacher);
router.patch('/courses/:id/status', validate(schemas.changeCourseStatus), changeCourseStatus);
router.patch('/courses/:id/approve', approveCourse);
router.delete('/courses/:id', deleteCourse);

// Analytics
router.get('/stats', getOverview);
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
