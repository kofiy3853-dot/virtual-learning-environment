const express = require('express');
const {
  validate,
  courseSchemas,
  assignmentSchemas,
} = require('../middleware/validation');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents,
} = require('../controllers/courseController');

const {
  enrollCourse,
  dropCourse,
} = require('../controllers/enrollmentController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(getCourses)
  .post(
    protect,
    authorize('teacher', 'admin'),
    validate(courseSchemas.create),
    createCourse
  );

router
  .route('/:id')
  .get(getCourse)
  .put(
    protect,
    authorize('teacher', 'admin'),
    validate(courseSchemas.update),
    updateCourse
  )
  .delete(protect, authorize('teacher', 'admin'), deleteCourse);

router.get('/:id/students', protect, authorize('teacher', 'admin'), getCourseStudents);

// Modules
const { getModules, createModule } = require('../controllers/moduleController');
router.route('/:id/modules').get(protect, getModules).post(protect, authorize('teacher', 'admin'), createModule);

// Assignments
const { getAssignments, createAssignment } = require('../controllers/assignmentController');
router
  .route('/:id/assignments')
  .get(protect, getAssignments)
  .post(
    protect,
    authorize('teacher', 'admin'),
    validate(assignmentSchemas.create),
    createAssignment
  );

// Enrollment sub-routes
router.post('/:id/enroll', protect, authorize('student'), enrollCourse);
router.delete('/:id/enroll', protect, authorize('student'), dropCourse);

// Re-route into other resource routers
router.use('/:id/grade-weights', require('./grades'));
router.use('/:id/gradebook', require('./grades'));
router.use('/:id/analytics', require('./grades'));
router.use('/:id/quizzes', require('./quizzes'));
router.use('/:id/attendance', require('./attendance'));
router.use('/:id', require('./communication')); // Handles /announcements and /discussions
router.use('/:id/live-sessions', require('./liveSessions'));

module.exports = router;
