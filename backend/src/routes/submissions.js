const express = require('express');
const { validate, schemas } = require('../middleware/validation');
const { gradeSubmission } = require('../controllers/submissionController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.patch(
  '/:id/grade',
  protect,
  authorize('teacher', 'admin'),
  validate(schemas.gradeSubmission),
  gradeSubmission
);

module.exports = router;
