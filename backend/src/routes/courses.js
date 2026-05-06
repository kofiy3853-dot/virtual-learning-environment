const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents
} = require('../controllers/courseController');

router.get('/', protect, getCourses);
router.get('/:id', protect, getCourse);
router.post('/',
  protect,
  authorize('teacher', 'admin'), // Keep admin here as previous logic had it
  validate(schemas.createCourse),
  createCourse
);
router.put('/:id',
  protect,
  authorize('teacher', 'admin'),
  validate(schemas.updateCourse),
  updateCourse
);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteCourse);
router.get('/:id/students', protect, authorize('teacher', 'admin'), getCourseStudents);

module.exports = router;
