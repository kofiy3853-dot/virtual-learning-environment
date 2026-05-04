const express = require('express');
const {
  setGradeWeights,
  getGradeWeights,
  getGradeBook,
} = require('../controllers/gradeController');

const {
  getCourseAnalytics,
  getAtRiskStudents,
} = require('../controllers/analyticsController');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// Course specific grades
router.route('/weights')
  .get(protect, getGradeWeights)
  .post(protect, authorize('teacher', 'admin'), setGradeWeights)
  .patch(protect, authorize('teacher', 'admin'), setGradeWeights);

router.get('/gradebook', protect, authorize('teacher', 'admin'), getGradeBook);
router.get('/analytics', protect, authorize('teacher', 'admin'), getCourseAnalytics);
router.get('/analytics/at-risk', protect, authorize('teacher', 'admin'), getAtRiskStudents);

module.exports = router;
